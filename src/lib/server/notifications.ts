import { and } from '@triplit/client';
import {
	NotificationType,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	NotificationPermissions,
	Status,
	TaskName,
	notificationTypeToPermMap,
	flattenableNotificationTypes,
	DeliveryPermissions,
	notificationTypeToDeliveryMap,
	notificationTypesNoRateLimit
} from '$lib/enums';
import type { NotificationQueueEntry, PushNotificationPayload } from '$lib/types';
import { arrayToStringRepresentation, stringRepresentationToArray } from '$lib/utils';
import {
	getAttendeeUserIdsOfEvent,
	triplitHttpClient,
	validateAnnouncements,
	validateAttendees,
	validateFiles,
	validateMessageIds,
	validateTempAttendees,
	validateUserIds
} from './triplit';
import { getTaskLockState, updateTaskLockState } from './database/tasklock';
import { sendPushNotification } from '$lib/webpush';
import { sendSmsMessage } from '$lib/sms';
import { sendEmailNotification } from './email/email';
import { env as publicEnv } from '$env/dynamic/public';

export class Notification {
	eventId: string;
	userId: string;
	message: string;
	objectType: NotificationType;
	objectIds: string[];
	pushNotificationPayload: PushNotificationPayload;
	requiredPermissions: PermissionValue[];

	constructor(
		eventId: string,
		userId: string,
		message: string,
		objectType: NotificationType,
		objectIds: string[],
		pushNotificationPayload: PushNotificationPayload,
		requiredPermissions: PermissionValue[]
	) {
		this.eventId = eventId;
		this.userId = userId;
		this.message = message;
		this.objectType = objectType;
		this.objectIds = objectIds;
		this.pushNotificationPayload = pushNotificationPayload;
		this.requiredPermissions = requiredPermissions;
	}
}

export const runNotificationProcessor = async () => {
	const taskName = TaskName.PROCESS_NOTIFICATION_QUEUE;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task is already running. Skipping execution.');
			return;
		} else {
			console.debug('Start notification processing task.');
		}
		await updateTaskLockState(taskName, true);

		const query = triplitHttpClient.query('notifications_queue').Where([
			['sent', '=', false] // Only fetch unsent notifications
		]);
		// Fetch the notifications
		const notifications_queue_items = await triplitHttpClient.fetch(query);

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

export async function processNotificationQueue(notificationQueueEntry: NotificationQueueEntry) {
	if (notificationQueueEntry.sent_at) {
		return;
	}

	// console.debug(
	// 	`Processing notification queue object created by user ${notificationQueueEntry.user_id}:`,
	// 	notificationQueueEntry
	// );

	// Parse object_ids into an array
	const objectIds = stringRepresentationToArray(notificationQueueEntry.object_ids);

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
		case NotificationType.ADMIN_ADDED:
			validObjectIds = await validateUserIds(objectIds);
			break;
		case NotificationType.NEW_MESSAGE:
			validObjectIds = await validateMessageIds(objectIds);
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
			// await notifyAttendeesOfAnnouncements(notificationQueueEntry.event_id, validObjectIds);
			notifications.push(
				...(await createAnnouncementNotifications(notificationQueueEntry.event_id, validObjectIds))
			);
			break;
		case NotificationType.FILES:
			// await notifyAttendeesOfFiles(notificationQueueEntry.event_id, validObjectIds);
			notifications.push(
				...(await createFileNotifications(notificationQueueEntry.event_id, validObjectIds))
			);
			break;
		case NotificationType.ATTENDEES:
			// await notifyEventCreatorOfAttendees(notificationQueueEntry.event_id, validObjectIds);
			notifications.push(
				...(await createAttendeeNotifications(notificationQueueEntry.event_id, validObjectIds))
			);
			break;
		case NotificationType.TEMP_ATTENDEES:
			// await notifyEventCreatorOfTemporaryAttendees(notificationQueueEntry.event_id, validObjectIds);
			notifications.push(
				...(await createTempAttendeeNotifications(notificationQueueEntry.event_id, validObjectIds))
			);
			break;
		case NotificationType.ADMIN_ADDED:
			// await notifyAttendeeOfTheirNewAdminRole(notificationQueueEntry.event_id, validObjectIds);
			notifications.push(
				...(await createAdminAddedNotifications(notificationQueueEntry.event_id, validObjectIds))
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
				...(await createNewMessageNotifications(notificationQueueEntry.event_id, validObjectIds[0]))
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

async function getUnreadExistingNotification(
	attendeeUserId: string,
	eventId: string,
	object_type: NotificationType
) {
	const query = triplitHttpClient
		.query('notifications')
		.Where(
			and([
				['user_id', '=', attendeeUserId],
				['event_id', '=', eventId],
				['object_type', '=', object_type],
				['seen_at', '=', null]
			])
		)
		.Order('created_at', 'DESC');
	const notifs = await triplitHttpClient.fetch(query);

	if (notifs.length > 0) {
		return notifs[0];
	}
	return null;
}

// TODO: I've removed all flattening for now...will need to be done prior to creating notifications?
async function mergeSimilarNotifications(
	newObjectIds: string[],
	userId: string,
	eventId: string,
	notificationType: NotificationType
): Promise<boolean> {
	const existingNotification = await getUnreadExistingNotification(
		userId,
		eventId,
		notificationType
	);

	if (!existingNotification) {
		return false;
	}

	const existingObjectIds = existingNotification
		? stringRepresentationToArray(existingNotification.object_ids)
		: [];

	const updatedIds = Array.from(new Set([...existingObjectIds, ...newObjectIds]));

	await triplitHttpClient.update('notifications', existingNotification.id, {
		object_ids: arrayToStringRepresentation(updatedIds)
	});

	return true;
}

async function createAnnouncementNotifications(
	eventId: string,
	announcementIds: string[]
): Promise<Notification[]> {
	if (!announcementIds.length) return [];

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		eventId,
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		true, // Do not notify announcement creator, i.e., event creator
		notificationTypeToPermMap[NotificationType.ANNOUNCEMENT] as NotificationType
	);

	// TODO: filter out people who've already seen it
	const notifications: Notification[] = [];

	for (const attendeeUserId of attendingUserIds) {
		const numObjects = announcementIds.length;
		const message = `📢 You have ${numObjects} new ${numObjects > 1 ? 'announcements' : 'announcement'} in an event you're attending!`;
		const pushNotificationPayload = { title: 'New Announcements', body: message };

		notifications.push(
			new Notification(
				eventId,
				attendeeUserId,
				message,
				NotificationType.ANNOUNCEMENT,
				announcementIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity]
			)
		);
	}

	return notifications;
}

async function createFileNotifications(
	eventId: string,
	fileIds: string[]
): Promise<Notification[]> {
	if (!fileIds.length) return [];

	const fileQuery = triplitHttpClient
		.query('files')
		.Select(['id', 'uploader_id'])
		.Where([['id', 'in', fileIds]]);
	const files = await triplitHttpClient.fetch(fileQuery);
	const fileUploaderMap = new Map(files.map((file) => [file.id, file.uploader_id]));

	// TODO: filter out users who turned off the associated permission
	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		eventId,
		[Status.GOING, Status.MAYBE],
		false,
		notificationTypeToPermMap[NotificationType.FILES] as NotificationType
	);

	const notifications: Notification[] = [];

	for (const attendeeUserId of attendingUserIds) {
		const filteredFileIds = fileIds.filter(
			(fileId) => fileUploaderMap.get(fileId) !== attendeeUserId
		);

		if (!filteredFileIds.length) continue;

		const numObjects = filteredFileIds.length;
		const message = `📷 You have ${numObjects} new media ${numObjects > 1 ? 'files' : 'file'} in an event you're attending!`;
		const pushNotificationPayload = { title: 'New Files', body: message };

		notifications.push(
			new Notification(
				eventId,
				attendeeUserId,
				message,
				NotificationType.FILES,
				filteredFileIds,
				pushNotificationPayload,
				[NotificationPermissions.event_activity]
			)
		);
	}
	return notifications;
}

async function createAttendeeNotifications(
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['user_id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const attendeeCount = attendeeIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `🍻 ${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Attendees', body: message };

	return [
		new Notification(
			eventId,
			event.user_id,
			message,
			NotificationType.ATTENDEES,
			attendeeIds,
			pushNotificationPayload,
			[NotificationPermissions.event_activity]
		)
	];
}

async function createTempAttendeeNotifications(
	eventId: string,
	attendeeIds: string[]
): Promise<Notification[]> {
	if (!attendeeIds.length) return [];

	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['user_id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const attendeeCount = attendeeIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `🍻 ${attendeeCount} new temporary account ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Temporary Account Attendees', body: message };

	return [
		new Notification(
			eventId,
			event.user_id,
			message,
			NotificationType.TEMP_ATTENDEES,
			attendeeIds,
			pushNotificationPayload,
			[NotificationPermissions.event_activity]
		)
	];
}

async function createAdminAddedNotifications(
	eventId: string,
	newAdminUserIds: string[]
): Promise<Notification[]> {
	const creatorQuery = triplitHttpClient
		.query('events')
		.Select(['id', 'title'])
		.Where([['id', '=', eventId]]);
	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return [];

	const notifications: Notification[] = [];

	for (const newAdminUserId of newAdminUserIds) {
		const message = `🔐 You have been made an admin for the event: "${event.title}".`;
		const pushNotificationPayload = { title: "You're now an event admin!", body: message };

		notifications.push(
			new Notification(
				eventId,
				newAdminUserId,
				message,
				NotificationType.ADMIN_ADDED,
				[newAdminUserId],
				pushNotificationPayload,
				[NotificationPermissions.event_activity]
			)
		);
	}

	return notifications;
}

async function createNewMessageNotifications(
	eventId: string,
	newMessageId: string
): Promise<Notification[]> {
	if (!newMessageId) return [];

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		eventId,
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		false,
		notificationTypeToPermMap[NotificationType.NEW_MESSAGE] as NotificationType
	);

	// Remove sender ID from list of attendees
	const messages = await triplitHttpClient.fetch(
		triplitHttpClient.query('event_messages').Where(['id', '=', newMessageId]).Select(['user_id'])
	);

	if (!attendingUserIds.length) return [];

	// Extract user_ids from the messages
	const senderIds: Array<string> = messages.map((message: { user_id: string }) => message.user_id);
	const threadIds: Set<string> = new Set(
		messages.map((message: { thread_id: string }) => message.thread_id)
	);

	if (threadIds.size != 1) {
		console.error(
			`notifyAttendeesOfNewMessages should be called for a single thread but has the following: ${threadIds}`
		);
	}
	// Filter out sender IDs from the list of attendees
	let filteredAttendingUserIds = attendingUserIds.filter(
		(attendeeUserId) => !senderIds.includes(attendeeUserId)
	);

	// Get users who've already seen the message
	const seen_by = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('event_message_seen')
			.Where(['message_id', '=', newMessageId])
			.Select(['user_id'])
	);

	const seenByUserIds: Set<string> = new Set(
		seen_by.map((seen_by: { user_id: string }) => seen_by.user_id)
	);

	// Filter out users who've already seen the message
	filteredAttendingUserIds = filteredAttendingUserIds.filter(
		(attendeeUserId) => !seenByUserIds.has(attendeeUserId)
	);

	const message = `💬 You have a new message in an event you're attending`;
	const pushNotificationPayload = { title: 'New Message', body: message };

	return filteredAttendingUserIds.map(
		(attendeeUserId) =>
			new Notification(
				eventId,
				attendeeUserId,
				message,
				NotificationType.NEW_MESSAGE,
				[newMessageId],
				pushNotificationPayload,
				[NotificationPermissions.event_activity]
			)
	);
}

export type PermissionValue =
	(typeof NotificationPermissions)[keyof typeof NotificationPermissions];

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
		num_push_notifications_sent: 1, // Assuming each notification starts with 1 push notification sent
		created_at: new Date() // Set the creation timestamp
	}));

	// Bulk insert the notifications that need to be created
	await triplitHttpClient.bulkInsert({
		notifications: notificationObjects
	});

	return notificationsToCreate;
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

	// Extract user IDs for SMS and email notifications
	const smsUserIds = new Set(
		notificationsByDeliveryType[DeliveryPermissions.sms_notifications].map(
			(notification) => notification.userId
		)
	);
	const emailUserIds = new Set(
		notificationsByDeliveryType[DeliveryPermissions.email_notifications].map(
			(notification) => notification.userId
		)
	);

	// Combine user IDs for a single query
	const uniqueUserIds = Array.from(new Set([...smsUserIds, ...emailUserIds]));

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
								notification.userId
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
