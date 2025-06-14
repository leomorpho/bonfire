import { and, or } from '@triplit/client';
import {
	NotificationType,
	NotificationPermissions,
	TaskName,
	flattenableNotificationTypes,
	DeliveryPermissions,
	notificationTypeToDeliveryMap,
	notificationTypesNoRateLimit
} from '$lib/enums';
import type { NotificationQueueEntry, PushNotificationPayload } from '$lib/types';
import { arrayToStringRepresentation, stringRepresentationToArray } from '$lib/utils';
import {
	triplitHttpClient,
	validateAnnouncements,
	validateAttendees,
	validateFiles,
	validateMessageIds,
	validateTempAttendees,
	validateUserIds
} from '$lib/server/triplit';
import { sendPushNotification } from '$lib/server/webpush';
import { sendSmsMessage } from '$lib/sms';
import { sendEmailNotification } from '$lib/server/email/email';
import { env as publicEnv } from '$env/dynamic/public';
import {
	createAdminAddedNotifications,
	createAnnouncementNotifications,
	createAttendeeNotifications,
	createEventCancelledNotifications,
	createEventDeletedNotifications,
	createEventInvitationNotifications,
	createFileNotifications,
	createNewMessageNotifications,
	createNotificationMessage,
	createTempAttendeeNotifications
} from '$lib/server/notifications/notifications';
import { getTaskLockState, updateTaskLockState } from '../tasks';

import { Notification, type PermissionValue } from '$lib/server/notifications/notification';

export const runNotificationProcessor = async () => {
	const taskName = TaskName.PROCESS_NOTIFICATION_QUEUE;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task runNotificationProcessor is already running. Skipping execution.');
			return;
		} else {
			console.debug('Start notification processing task.');
		}
		await updateTaskLockState(taskName, true);

		// Fetch the notifications
		const notifications_queue_items = await triplitHttpClient.fetch(
			triplitHttpClient.query('notifications_queue').Where([
				['sent', '=', false] // Only fetch unsent notifications
			])
		);

		// Process each notifications
		for (const notification_queue_item of notifications_queue_items) {
			await processNotificationQueue(notification_queue_item as NotificationQueueEntry);
		}
	} catch (error) {
		console.error('Error running notification processor:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('failed to release task lock', e);
		}
	}
};

async function processNotificationQueue(notificationQueueEntry: NotificationQueueEntry) {
	if (notificationQueueEntry.sent_at) {
		return;
	}

	// TODO: create new system that uses sets instead of string for arrays of IDs. Do
	// not break reverse compatibility, just create a new field in notifications.
	// Parse object_ids into an array
	const objectIdsOriginal = stringRepresentationToArray(notificationQueueEntry.object_ids);
	const objectIdsSet = notificationQueueEntry.object_ids_set || new Set([]);
	const objectIds = Array.from(new Set([...objectIdsOriginal, ...objectIdsSet]));

	// Validate the object IDs based on object_type
	let validObjectIds: string[] = [];
	switch (notificationQueueEntry.object_type) {
		case NotificationType.ANNOUNCEMENT:
			validObjectIds = await validateAnnouncements(objectIds);
			break;
		case NotificationType.FILES:
			validObjectIds = await validateFiles(objectIds);
			break;
		case NotificationType.ATTENDEES:
			validObjectIds = await validateAttendees(objectIds);
			break;
		case NotificationType.TEMP_ATTENDEES:
			validObjectIds = await validateTempAttendees(objectIds);
			break;
		case NotificationType.YOU_WERE_ADDED_AS_ADMIN:
			validObjectIds = await validateUserIds(objectIds);
			break;
		case NotificationType.NEW_MESSAGE:
			validObjectIds = await validateMessageIds(objectIds);
			break;
		case NotificationType.EVENT_INVITATION:
			validObjectIds = await validateUserIds(objectIds);
			break;
		case NotificationType.EVENT_CANCELLED:
			validObjectIds = await validateUserIds(objectIds);
			break;
		case NotificationType.EVENT_DELETED:
			validObjectIds = await validateUserIds(objectIds);
			break;
		default:
			console.error(`Unknown object_type: ${notificationQueueEntry.object_type}`);
			return;
	}

	if (validObjectIds.length === 0) {
		console.warn(`No valid objects found for queued notification ${notificationQueueEntry.id}`);
		try {
			// Delete the notification queue entry
			await triplitHttpClient.delete('notifications_queue', notificationQueueEntry.id);
			console.log(
				`Deleted notification queue entry ${notificationQueueEntry.id} due to no valid objects.`
			);
		} catch (err) {
			console.error(
				`failed to delete notification queue object with id ${notificationQueueEntry.id}`,
				err
			);
		}
		return;
	}

	// Create a list of Notification objects
	let notifications: Notification[] = [];

	// Send notifications based on the type
	switch (notificationQueueEntry.object_type) {
		case NotificationType.ANNOUNCEMENT:
			notifications.push(
				...(await createAnnouncementNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.FILES:
			notifications.push(
				...(await createFileNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.ATTENDEES:
			notifications.push(
				...(await createAttendeeNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.TEMP_ATTENDEES:
			notifications.push(
				...(await createTempAttendeeNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.YOU_WERE_ADDED_AS_ADMIN:
			notifications.push(
				...(await createAdminAddedNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.NEW_MESSAGE:
			if (validObjectIds.length != 1) {
				throw new Error(
					`new message notification created with not exactly 1 message: ${validObjectIds}`
				);
			}
			// await notifyAttendeesOfNewMessages(notificationQueueEntry.event_id, validObjectIds[0]);
			notifications.push(
				...(await createNewMessageNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds[0]
				))
			);
			break;
		case NotificationType.EVENT_INVITATION:
			notifications.push(
				...(await createEventInvitationNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.EVENT_CANCELLED:
			notifications.push(
				...(await createEventCancelledNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		case NotificationType.EVENT_DELETED:
			notifications.push(
				...(await createEventDeletedNotifications(
					notificationQueueEntry.user_id,
					notificationQueueEntry.event_id,
					validObjectIds
				))
			);
			break;
		default:
			console.error(`Unknown object_type: ${notificationQueueEntry.object_type}`);
			return;
	}
	notifications = await bulkPersistNotifications(notifications);

	// Bulk notify end-users with these objects
	await bulkNotifyUsers(notifications);

	// Mark the notification as sent
	await triplitHttpClient.update(
		'notifications_queue',
		notificationQueueEntry.id,
		async (entity) => {
			entity.sent_at = new Date();
			entity.sent = true;
		}
	);

	// TODO: do we need to delete any object older than X in notifications_queue?

	// console.debug(`Notification ${notificationQueueEntry.id} marked as sent.`);
}

async function getUnreadExistingNotifications(
	attendeeUserId: string,
	eventId: string,
	objectType: NotificationType
	// objectIds: Array<string>
) {
	// const objectIdsFilter = or(objectIds.map((id) => ['object_ids_set', 'has', id]));

	const query = triplitHttpClient
		.query('notifications')
		.Where(
			and([
				['user_id', '=', attendeeUserId],
				['event_id', '=', eventId],
				['object_type', '=', objectType],
				// objectIdsFilter
				['seen_at', '=', null]
			])
		)
		.Order('created_at', 'DESC');
	return await triplitHttpClient.fetch(query);
}

async function mergeSimilarNotifications(
	newObjectIds: string[],
	userId: string,
	eventId: string,
	notificationType: NotificationType
): Promise<boolean> {
	const existingNotifications = await getUnreadExistingNotifications(
		userId,
		eventId,
		notificationType
		// newObjectIds
	);

	if (!existingNotifications || existingNotifications.length === 0) {
		return false;
	}

	// Merge object IDs from all existing notifications
	const mergedObjectIdsSet = new Set<string>();
	existingNotifications.forEach((notification) => {
		const objectIdsArray = stringRepresentationToArray(notification.object_ids);
		const objectIdsSet = notification.object_ids_set || new Set();
		objectIdsArray.forEach((id) => mergedObjectIdsSet.add(id));
		objectIdsSet.forEach((id) => mergedObjectIdsSet.add(id));
	});

	// Add new object IDs to the merged set
	newObjectIds.forEach((id) => mergedObjectIdsSet.add(id));

	// Convert the merged set to an array
	const mergedObjectIds = Array.from(mergedObjectIdsSet);
	const numObjects = mergedObjectIds.length;

	// Generate the updated message and title
	const message = createNotificationMessage(notificationType, numObjects);

	// Delete the old notifications
	for (const notification of existingNotifications) {
		await triplitHttpClient.delete('notifications', notification.id);
	}

	// Create a new notification with the merged object IDs
	await triplitHttpClient.insert('notifications', {
		user_id: userId,
		event_id: eventId,
		object_type: notificationType,
		object_ids: arrayToStringRepresentation(mergedObjectIds),
		object_ids_set: mergedObjectIdsSet,
		message: message
		// Add other necessary fields for the notification
	});

	return true;
}


export async function bulkPersistNotifications(
	notifications: Notification[]
): Promise<Notification[]> {
	// List to keep track of notifications that need to be created in the DB
	const notificationsToCreate: Notification[] = [];

	// For each notification, if the type supports it, check if we can flatten it with a prior unread one.
	for (const notification of notifications) {
		if (flattenableNotificationTypes.has(notification.objectType)) {
			const userId = notification.userId;
			const eventId = notification.eventId;
			const notificationType = notification.objectType;

			// Try to merge similar notifications
			const merged = await mergeSimilarNotifications(
				notification.objectIds,
				userId,
				eventId,
				notificationType
			);

			if (merged) {
				// If merged successfully, skip creating this notification
				continue;
			}
		}

		// If not merged, add to the list of notifications to create
		notificationsToCreate.push(notification);
	}

	// Map Notification objects to the database schema
	const notificationObjects = notificationsToCreate.map((notification) => ({
		event_id: notification.eventId,
		user_id: notification.userId,
		message: notification.message,
		object_type: notification.objectType,
		object_ids: arrayToStringRepresentation(notification.objectIds),
		object_ids_set: notification.objectIdsSet,
		num_push_notifications_sent: 1, // Assuming each notification starts with 1 push notification sent
		created_at: new Date() // Set the creation timestamp
	}));

	// Bulk insert the notifications that need to be created
	await triplitHttpClient.bulkInsert({
		notifications: notificationObjects
	});

	// Filter and return only notifications that have isInAppOnly set to false
	return notificationsToCreate.filter((notification) => !notification.isInAppOnly);
}

export async function bulkNotifyUsers(notifications: Notification[]): Promise<void> {
	// If we got these notifications, we can assume the notification permissions were respected.
	// We just need to check delivery permissions.

	// Map Notification objects to the database schema
	const userIds = notifications.map((notification) => notification.userId);

	// Fetch delivery permissions for all users
	const deliveryPerms = await triplitHttpClient.fetch(
		triplitHttpClient.query('delivery_permissions').Where(['user_id', 'in', userIds])
	);

	// Create a map of user IDs to their delivery permissions
	const userDeliveryPermsMap: { [key: string]: { [key: string]: boolean } } = {};
	deliveryPerms.forEach((perm) => {
		if (!userDeliveryPermsMap[perm.user_id]) {
			userDeliveryPermsMap[perm.user_id] = {};
		}
		userDeliveryPermsMap[perm.user_id][perm.permission] = perm.granted;
	});

	// Separate notifications by delivery type
	const notificationsByDeliveryType: { [key: string]: Notification[] } = {
		push_notifications: [],
		sms_notifications: [],
		email_notifications: []
	};

	for (const notification of notifications) {
		const userId = notification.userId;
		const userDeliveryPerms = userDeliveryPermsMap[userId];

		if (!userDeliveryPerms) {
			console.warn(`No delivery permissions found for user ${userId}`);
			continue;
		}

		const deliveryTypes = notificationTypeToDeliveryMap[notification.objectType];

		for (const deliveryType of deliveryTypes) {
			if (userDeliveryPerms[deliveryType]) {
				notificationsByDeliveryType[deliveryType].push(notification);
			}
		}
	}

	// TODO: undo when SMS is live
	// Extract user IDs for SMS and email notifications
	// const smsUserIds = new Set(
	// 	notificationsByDeliveryType[DeliveryPermissions.sms_notifications].map(
	// 		(notification) => notification.userId
	// 	)
	// );
	const emailUserIds = new Set(
		notificationsByDeliveryType[DeliveryPermissions.email_notifications].map(
			(notification) => notification.userId
		)
	);
	// TODO: undo when SMS is live

	// Combine user IDs for a single query
	// const uniqueUserIds = Array.from(new Set([...smsUserIds, ...emailUserIds]));
	const uniqueUserIds = Array.from(emailUserIds);

	// Bulk query user model to get phone numbers and emails
	const usersWithPersonalData = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('user_personal_data')
			.Where(['user_id', 'in', uniqueUserIds])
			.Select(['user_id', 'phone_number', 'email'])
	);

	// Create maps of user ID to phone number and email
	const userPhoneNumberMap: { [key: string]: string } = {};
	const userEmailMap: { [key: string]: string } = {};
	usersWithPersonalData.forEach((user) => {
		if (user.phone_number) {
			userPhoneNumberMap[user.user_id] = user.phone_number;
		}
		if (user.email) {
			userEmailMap[user.user_id] = user.email;
		}
	});

	let notificationsLink = publicEnv.PUBLIC_ORIGIN;

	/// Send notifications by delivery type
	for (const deliveryType of Object.keys(notificationsByDeliveryType)) {
		const notificationsToSend = notificationsByDeliveryType[deliveryType];
		if (notificationsToSend.length > 0) {
			switch (deliveryType) {
				case DeliveryPermissions.push_notifications:
					for (const notification of notificationsToSend) {
						const isRateLimitEnabled = !notificationTypesNoRateLimit.has(notification.objectType);
						await sendPushNotification(
							notification.userId,
							notification.pushNotificationPayload,
							isRateLimitEnabled
						);
					}
					break;
				case DeliveryPermissions.sms_notifications:
					for (const notification of notificationsToSend) {
						if (notification.eventId) {
							notificationsLink = `${notificationsLink}/bonfire/${notification.eventId}`;
						}

						const phoneNumber = userPhoneNumberMap[notification.userId];
						if (phoneNumber) {
							await sendSmsMessage(
								notification.userId,
								phoneNumber,
								notification.message + notificationsLink,
								notification.objectType
							);
						} else {
							console.warn(`No phone number found for user ${notification.userId}`);
						}
					}
					break;
				case DeliveryPermissions.email_notifications:
					for (const notification of notificationsToSend) {
						const email = userEmailMap[notification.userId];
						if (email) {
							await sendEmailNotification(
								email,
								notification.objectType,
								notification.message,
								notification.userId,
								notification.eventId
							);
						} else {
							console.warn(`No email found for user ${notification.userId}`);
						}
					}
					break;
				default:
					console.warn(`Unsupported delivery type: ${deliveryType}`);
			}
		}
	}
}
