import { error } from '@sveltejs/kit';
import webPush from 'web-push';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

import { dev } from '$app/environment';
import { notificationPermissionTable, pushSubscriptionTable } from './server/database/schema';
import { eq } from 'drizzle-orm';
import { db } from './server/database/db';
import type { PermissionValue } from './server/push';
import { triplitHttpClient } from './server/triplit';

if (
	(dev && (!publicEnv.PUBLIC_DEV_VAPID_PUBLIC_KEY || !privateEnv.DEV_VAPID_PRIVATE_KEY)) ||
	(!dev && (!publicEnv.PUBLIC_VAPID_PUBLIC_KEY || !privateEnv.VAPID_PRIVATE_KEY))
) {
	throw error;
}

const publicKey: string = dev
	? (publicEnv.PUBLIC_DEV_VAPID_PUBLIC_KEY ?? '')
	: (publicEnv.PUBLIC_VAPID_PUBLIC_KEY ?? '');
const privateKey: string = dev ? privateEnv.DEV_VAPID_PRIVATE_KEY : privateEnv.VAPID_PRIVATE_KEY;

webPush.setVapidDetails(
	`mailto:${publicEnv.PUBLIC_FROM_EMAIL}`,
	publicKey as string,
	privateKey as string
);

async function hasExceededUnreadNotificationLimitInTimeframe(
	userId: string,
	timeFrameMinutes: number = 60,
	maxNotifications: number = 5
): Promise<boolean> {
	// Calculate the time frame for recent notifications
	const timeFrameMillis = timeFrameMinutes * 60 * 1000; // Convert minutes to milliseconds
	const timeFrameAgo = new Date(Date.now() - timeFrameMillis);

	// Query the notifications to count unread notifications within the time frame
	const unreadNotifications = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('notifications')
			.Where([
				['user_id', '=', userId],
				['seen_at', '=', null],
				['created_at', '>=', timeFrameAgo]
			])
			.Select(['id'])
			
	);

	// Return true if the number of unread notifications exceeds the limit
	return unreadNotifications.length > maxNotifications;
}

/**
 * Sends a push notification to a specific user by fetching their push subscriptions.
 * @param userId - The user ID to whom the notification is sent.
 * @param payload - The payload for the notification (e.g., title, body, icon).
 * @returns {Promise<void>} - Resolves when the notification is sent.
 */
export async function sendPushNotification(
	userId: string,
	payload: { title: string; body: string; icon?: string; badge?: number },
	requiredPermissions: PermissionValue[] // Array of required permissions
): Promise<void> {
	if (await hasExceededUnreadNotificationLimitInTimeframe(userId)) {
		// Don't send any new push notification.
		return;
	}
	// Check user permissions
	const userPermissions = await db
		.Select({
			oneDayReminder: notificationPermissionTable.oneDayReminder,
			eventActivity: notificationPermissionTable.eventActivity
		})
		.from(notificationPermissionTable)
		.Where(eq(notificationPermissionTable.userId, userId));

	if (!userPermissions.length) {
		// console.debug(`No permissions found for user ID: ${userId}`);
		return;
	}

	// Check if user has at least one required permission
	const hasPermission = requiredPermissions.some((permission) => userPermissions[0][permission]);

	if (!hasPermission) {
		// console.debug(`User ID: ${userId} does not have required permissions.`);
		return;
	}

	// Fetch subscriptions for the given userId
	const subscriptions = await db
		.Select({
			endpoint: pushSubscriptionTable.endpoint,
			p256dh: pushSubscriptionTable.p256dh,
			auth: pushSubscriptionTable.auth
		})
		.from(pushSubscriptionTable)
		.Where(eq(pushSubscriptionTable.userId, userId));

	if (!subscriptions.length) {
		// console.info(`No push subscriptions found for user ID: ${userId}`);
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
			subject: `mailto:${env.env.PUBLIC_FROM_EMAIL}`,
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
	if (dev) {
		console.log(
			'Push NOTIFICAITON ############################################################################'
		);
	}
}
