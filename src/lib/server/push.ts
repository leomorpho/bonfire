import { and } from '@triplit/client';
import {
	MAX_NUM_PUSH_NOTIF_PER_NOTIFICATION,
	NotificationType,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	PermissionType,
	Status,
	TaskName
} from '$lib/enums';
import type {
	NotificationQueueEntry,
	NotificationTypescriptType,
	PushNotificationPayload
} from '$lib/types';
import { arrayToStringRepresentation, stringRepresentationToArray } from '$lib/utils';
import { sendPushNotification } from '$lib/webpush';
import {
	getAttendeeUserIdsOfEvent,
	triplitHttpClient,
	validateAnnouncements,
	validateAttendees,
	validateFiles,
	validateTempAttendees
} from './triplit';
import { getTaskLockState, updateTaskLockState } from './database/tasklock';

export const runNotificationProcessor = async () => {
	const taskName = TaskName.PROCESS_NOTIFICATION_QUEUE;
	const locked = await getTaskLockState(taskName);

	if (locked) {
		console.debug('Task is already running. Skipping execution.');
		return;
	} else {
		console.debug('Start notification processing task.');
	}

	try {
		await updateTaskLockState(taskName, true);

		const query = triplitHttpClient
			.query('notifications_queue')
			.where([
				['sent', '=', false] // Only fetch unsent notifications
			])
			.build();

		// Fetch the notifications
		const notifications = await triplitHttpClient.fetch(query);

		// Process each notifications
		for (const notification of notifications) {
			await processNotificationQueue(notification as NotificationQueueEntry);
		}
	} catch (error) {
		console.error('Error running notification processor:', error);
	} finally {
		await updateTaskLockState(taskName, false);
	}
};

export async function processNotificationQueue(notificationQueueEntry: NotificationQueueEntry) {
	if (notificationQueueEntry.sent_at) {
		return;
	}

	console.debug(
		`Processing notification queue object created by user ${notificationQueueEntry.user_id}:`,
		notificationQueueEntry
	);

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
		default:
			console.error(`Unknown object_type: ${notificationQueueEntry.object_type}`);
			return;
	}

	if (validObjectIds.length === 0) {
		console.warn(`No valid objects found for queued notification ${notificationQueueEntry.id}`);
		// Delete the notification queue entry
		await triplitHttpClient.delete('notifications_queue', notificationQueueEntry.id);
		console.log(
			`Deleted notification queue entry ${notificationQueueEntry.id} due to no valid objects.`
		);
		return;
	}

	// Send notifications based on the type
	switch (notificationQueueEntry.object_type) {
		case NotificationType.ANNOUNCEMENT:
			await notifyAttendeesOfAnnouncements(notificationQueueEntry.event_id, validObjectIds);
			break;
		case NotificationType.FILES:
			await notifyAttendeesOfFiles(notificationQueueEntry.event_id, validObjectIds);
			break;
		case NotificationType.ATTENDEES:
			await notifyEventCreatorOfAttendees(notificationQueueEntry.event_id, validObjectIds);
			break;
		case NotificationType.TEMP_ATTENDEES:
			await notifyEventCreatorOfTemporaryAttendees(notificationQueueEntry.event_id, validObjectIds);
			break;
		default:
			console.error(`Unknown object_type: ${notificationQueueEntry.object_type}`);
			return;
	}

	// Mark the notification as sent
	await triplitHttpClient.update(
		'notifications_queue',
		notificationQueueEntry.id,
		async (entity) => {
			entity.sent_at = new Date().toISOString();
			entity.sent = true;
		}
	);

	// console.debug(`Notification ${notificationQueueEntry.id} marked as sent.`);
}

async function getUnreadExistingNotification(
	attendeeUserId: string,
	eventId: string,
	object_type: NotificationType
) {
	const query = triplitHttpClient
		.query('notifications')
		.where(
			and([
				['user_id', '=', attendeeUserId],
				['event_id', '=', eventId],
				['object_type', '=', object_type],
				['seen_at', '=', null]
			])
		)
		.order('created_at', 'DESC')
		.build();

	const notifs = await triplitHttpClient.fetch(query);

	if (notifs.length > 0) {
		return notifs[0];
	}
	return null;
}

async function notifyAttendeesOfAnnouncements(
	eventId: string,
	announcementIds: string[]
): Promise<void> {
	if (!announcementIds.length) return;

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		eventId,
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		true // Do not notify announcement creator, i.e., event creator
	);

	if (!attendingUserIds.length) return;

	for (const attendeeUserId of attendingUserIds) {
		const existingNotification = await getUnreadExistingNotification(
			attendeeUserId,
			eventId,
			NotificationType.ANNOUNCEMENT
		);

		const existingObjectIds = existingNotification
			? stringRepresentationToArray(existingNotification.object_ids)
			: [];
		const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...announcementIds]));

		const message = `You have ${updatedObjectIds.length} new announcements in an event you're attending!`;
		const pushNotificationPayload = { title: 'New Announcements', body: message };

		await handleNotification(
			existingNotification as NotificationTypescriptType | null,
			attendeeUserId,
			eventId,
			NotificationType.ANNOUNCEMENT,
			updatedObjectIds,
			message,
			pushNotificationPayload
		);
	}
}

async function notifyAttendeesOfFiles(eventId: string, fileIds: string[]): Promise<void> {
	if (!fileIds.length) return;

	const fileQuery = triplitHttpClient
		.query('files')
		// .select(['id', 'uploader_id']) // TODO: triplit bug preventing select
		.where([['id', 'in', fileIds]])
		.build();

	const files = await triplitHttpClient.fetch(fileQuery);
	const fileUploaderMap = new Map(files.map((file) => [file.id, file.uploader_id]));

	const attendingUserIds = await getAttendeeUserIdsOfEvent(eventId, [Status.GOING, Status.MAYBE]);

	if (!attendingUserIds.length) return;

	for (const attendeeUserId of attendingUserIds) {
		const filteredFileIds = fileIds.filter(
			(fileId) => fileUploaderMap.get(fileId) !== attendeeUserId
		);

		if (!filteredFileIds.length) continue;

		const existingNotification = await getUnreadExistingNotification(
			attendeeUserId,
			eventId,
			NotificationType.FILES
		);

		const existingObjectIds = existingNotification
			? stringRepresentationToArray(existingNotification.object_ids)
			: [];
		const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...filteredFileIds]));

		const message = `You have ${updatedObjectIds.length} new files in an event you're attending!`;
		const pushNotificationPayload = { title: 'New Files', body: message };

		await handleNotification(
			existingNotification as NotificationTypescriptType | null,
			attendeeUserId,
			eventId,
			NotificationType.FILES,
			updatedObjectIds,
			message,
			pushNotificationPayload
		);
	}
}

async function notifyEventCreatorOfAttendees(
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!attendeeIds.length) return;

	const creatorQuery = triplitHttpClient
		.query('events')
		// .select(['user_id', 'title']) // TODO: triplit bug preventing select
		.where([['id', '=', eventId]])
		.build();

	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return;

	const existingNotification = await getUnreadExistingNotification(
		event.user_id,
		eventId,
		NotificationType.ATTENDEES
	);

	const existingObjectIds = existingNotification
		? stringRepresentationToArray(existingNotification.object_ids)
		: [];
	const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...attendeeIds]));

	const attendeeCount = updatedObjectIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Attendees', body: message };

	await handleNotification(
		existingNotification as NotificationTypescriptType | null,
		event.user_id,
		eventId,
		NotificationType.ATTENDEES,
		updatedObjectIds,
		message,
		pushNotificationPayload
	);
}

async function notifyEventCreatorOfTemporaryAttendees(
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!attendeeIds.length) return;

	const creatorQuery = triplitHttpClient
		.query('events')
		// .select(['user_id', 'title']) // TODO: triplit bug preventing select
		.where([['id', '=', eventId]])
		.build();

	const [event] = await triplitHttpClient.fetch(creatorQuery);

	if (!event) return;

	const existingNotification = await getUnreadExistingNotification(
		event.user_id,
		eventId,
		NotificationType.TEMP_ATTENDEES
	);

	const existingObjectIds = existingNotification
		? stringRepresentationToArray(existingNotification.object_ids)
		: [];
	const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...attendeeIds]));

	const attendeeCount = updatedObjectIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `${attendeeCount} new temporary account ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Temporary Account Attendees', body: message };

	console.log('########## UPDATE NOTIOF!!!!', pushNotificationPayload);
	await handleNotification(
		existingNotification as NotificationTypescriptType | null,
		event.user_id,
		eventId,
		NotificationType.TEMP_ATTENDEES,
		updatedObjectIds,
		message,
		pushNotificationPayload
	);
}

export type PermissionValue = (typeof PermissionType)[keyof typeof PermissionType];

async function handleNotification(
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
		case NotificationType.ANNOUNCEMENT:
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		case NotificationType.ATTENDEES:
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		case NotificationType.TEMP_ATTENDEES:
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		case NotificationType.FILES:
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

		await triplitHttpClient.update('notifications', existingNotification.id, (entity: any) => {
			entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
			entity.message = message;

			if (pushNotificationSent) {
				entity.num_push_notifications_sent = (entity.num_push_notifications_sent || 0) + 1;
			}
		});
		console.debug(`Updated notification for user ${recipientUserId}.`);
	} else {
		await triplitHttpClient.insert('notifications', {
			event_id: eventId,
			user_id: recipientUserId,
			message,
			object_type: objectType,
			object_ids: arrayToStringRepresentation(updatedObjectIds),
			num_push_notifications_sent: 1
		});

		await sendPushNotification(recipientUserId, pushNotificationPayload, requiredPermissions);
		console.debug(`Created a new notification for user ${recipientUserId}.`);
	}
}
