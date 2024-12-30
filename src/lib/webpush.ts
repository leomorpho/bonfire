import { error } from '@sveltejs/kit';
import webPush from 'web-push';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { PUBLIC_DEV_VAPID_PUBLIC_KEY, PUBLIC_VAPID_PUBLIC_KEY } from '$env/static/public';
import { notificationPermissionTable, pushSubscriptionTable } from './server/database/schema';
import { eq } from 'drizzle-orm';
import { db } from './server/database/db';
import { arrayToStringRepresentation } from './utils';
import { MAX_NUM_PUSH_NOTIF_PER_NOTIFICATION, PermissionType } from './enums';
import type { NotificationTypescriptType, PushNotificationPayload } from './types';

if (
	(dev && (!PUBLIC_DEV_VAPID_PUBLIC_KEY || !env.DEV_VAPID_PRIVATE_KEY)) ||
	(!dev && (!PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY))
) {
	throw error;
}

const publicKey = dev ? PUBLIC_DEV_VAPID_PUBLIC_KEY : PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = dev ? env.DEV_VAPID_PRIVATE_KEY : env.VAPID_PRIVATE_KEY;

webPush.setVapidDetails(`mailto:${env.FROM_EMAIL}`, publicKey as string, privateKey as string);

/**
 * Sends a push notification to a specific user by fetching their push subscriptions.
 * @param userId - The user ID to whom the notification is sent.
 * @param payload - The payload for the notification (e.g., title, body, icon).
 * @returns {Promise<void>} - Resolves when the notification is sent.
 */
export async function sendPushNotification(
	userId: string,
	payload: { title: string; body: string; icon?: string; badge?: number },
	requiredPermissions: PermissionKey[] // Array of required permissions
): Promise<void> {
	// Check user permissions
	const userPermissions = await db
		.select({
			oneDayReminder: notificationPermissionTable.oneDayReminder,
			eventActivity: notificationPermissionTable.eventActivity
		})
		.from(notificationPermissionTable)
		.where(eq(notificationPermissionTable.userId, userId));

	if (!userPermissions.length) {
		console.debug(`No permissions found for user ID: ${userId}`);
		return;
	}

	// Check if user has at least one required permission
	const hasPermission = requiredPermissions.some((permission) => userPermissions[0][permission]);

	if (!hasPermission) {
		console.debug(`User ID: ${userId} does not have required permissions.`);
		return;
	}

	// Fetch subscriptions for the given userId
	const subscriptions = await db
		.select({
			endpoint: pushSubscriptionTable.endpoint,
			p256dh: pushSubscriptionTable.p256dh,
			auth: pushSubscriptionTable.auth
		})
		.from(pushSubscriptionTable)
		.where(eq(pushSubscriptionTable.userId, userId));

	if (!subscriptions.length) {
		console.info(`No push subscriptions found for user ID: ${userId}`);
		return;
	}

	// Construct the notification payload
	const notificationPayload = JSON.stringify({
		title: payload.title,
		body: payload.body,
		icon: payload.icon,
		badge: payload.badge
	});

	// Define VAPID options
	const options = {
		vapidDetails: {
			subject: `mailto:${env.FROM_EMAIL}`,
			publicKey,
			privateKey
		},
		TTL: 86400, // Set TTL to 1 day (in seconds)
		urgency: 'normal', // Adjust urgency as needed
		contentEncoding: 'aesgcm' // Use default encoding
	};

	// Send notifications to all user subscriptions
	await Promise.all(
		subscriptions.map(async (subscription) => {
			const pushSubscription = {
				endpoint: subscription.endpoint,
				keys: {
					p256dh: subscription.p256dh,
					auth: subscription.auth
				}
			};

			try {
				await webPush.sendNotification(pushSubscription, notificationPayload, options);
				console.log(`Notification sent to user ID: ${userId}, endpoint: ${subscription.endpoint}`);
			} catch (error) {
				console.error(`Failed to send notification to endpoint: ${subscription.endpoint}`, error);
			}
		})
	);
}

type PermissionValue = (typeof PermissionType)[keyof typeof PermissionType];

export async function handleNotification(
	triplitTx: any,
	existingNotification: NotificationTypescriptType | null,
	recipientUserId: string,
	eventId: string,
	objectType: string,
	updatedObjectIds: string[],
	message: string,
	pushNotificationPayload: PushNotificationPayload
): Promise<void> {
	let pushNotificationSent = false;

	let requiredPermissions: PermissionValue[] = [];

	// Set required permissions based on objectType
	switch (objectType) {
		case 'event':
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		case 'reminder':
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		default:
			console.warn(`Unknown objectType: ${objectType}`);
			return;
	}

	if (existingNotification) {
		if (existingNotification.num_push_notifications_sent < MAX_NUM_PUSH_NOTIF_PER_NOTIFICATION) {
			await sendPushNotification(recipientUserId, pushNotificationPayload, requiredPermissions);
			pushNotificationSent = true;
		}

		await triplitTx.update('notifications', existingNotification.id, (entity: any) => {
			entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
			entity.message = message;

			if (pushNotificationSent) {
				entity.num_push_notifications_sent = (entity.num_push_notifications_sent || 0) + 1;
			}
		});
		console.log(`Updated notification for user ${recipientUserId}.`);
	} else {
		await triplitTx.insert('notifications', {
			event_id: eventId,
			user_id: recipientUserId,
			message,
			object_type: objectType,
			object_ids: arrayToStringRepresentation(updatedObjectIds),
			num_push_notifications_sent: 1
		});

		await sendPushNotification(recipientUserId, pushNotificationPayload, requiredPermissions);
		console.log(`Created a new notification for user ${recipientUserId}.`);
	}
}
