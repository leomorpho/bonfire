import { TriplitClient, and } from '@triplit/client';
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
	serverTriplitClient,
	validateAnnouncements,
	validateAttendees,
	validateFiles
} from './triplit';
import { getTaskLockState, updateTaskLockState } from './database/tasklock';

export const runNotificationProcessor = async () => {
	const taskName = TaskName.PROCESS_NOTIFICATION_QUEUE;
	const lockState = await getTaskLockState(taskName);

	if (lockState?.locked) {
		console.log('Task is already running. Skipping execution.');
		return;
	}

	try {
		await updateTaskLockState(taskName, true);

		const query = serverTriplitClient
			.query('notifications_queue')
			.where([
				['sent_at', '=', null] // Only fetch unsent notifications
			])
			.build();

		// Fetch the notifications
		const notifications = await serverTriplitClient.fetch(query);

		// Process each notification
		for (const notification of notifications) {
			await processNotificationQueue(notification); // Custom logic for handling notifications
		}
	} catch (error) {
		console.error('Error running notification processor:', error);
	} finally {
		await updateTaskLockState(taskName, false);
	}
};

export async function processNotificationQueue(notificationQueueEntry: NotificationQueueEntry) {
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
			validObjectIds = await validateAnnouncements(serverTriplitClient as TriplitClient, objectIds);
			break;
		case NotificationType.FILES:
			validObjectIds = await validateFiles(serverTriplitClient as TriplitClient, objectIds);
			break;
		case NotificationType.ATTENDEES:
			validObjectIds = await validateAttendees(serverTriplitClient as TriplitClient, objectIds);
			break;
		default:
			console.error(`Unknown object_type: ${notificationQueueEntry.object_type}`);
			return;
	}

	if (validObjectIds.length === 0) {
		console.warn(`No valid objects found for queued notification ${notificationQueueEntry.id}`);
		// Delete the notification queue entry
		await serverTriplitClient.delete('notifications_queue', notificationQueueEntry.id);
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
	}

	// Mark the notification as sent
	await serverTriplitClient.update(
		'notifications_queue',
		notificationQueueEntry.id,
		async (entity) => {
			entity.sent_at = new Date();
		}
	);

	console.debug(`Notification ${notificationQueueEntry.id} marked as sent.`);
}

async function getUnreadExistingNotification(
	attendeeUserId: string,
	eventId: string,
	object_type: NotificationType
) {
	const query = serverTriplitClient
		.query('notifications')
		.where(
			and([
				['user_id', '=', attendeeUserId],
				['event_id', '=', eventId],
				['object_type', '=', object_type],
				['seen_at', '=', null]
			])
		)
		.build();

	const [existingNotification] = await serverTriplitClient.fetch(query);
	return existingNotification || null;
}

async function notifyAttendeesOfAnnouncements(
	eventId: string,
	announcementIds: string[]
): Promise<void> {
	if (!announcementIds.length) return;

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		serverTriplitClient as TriplitClient,
		eventId,
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		true // Do not notify announcement creator, i.e., event creator
	);

	if (!attendingUserIds.length) return;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
			const existingNotification = await getUnreadExistingNotification(
				attendeeUserId,
				eventId,
				NotificationType.ANNOUNCEMENT
			);
			if (attendeeUserId == 'qgo0paa9qnfcnof') {
				console.log(
					'-------------------------------------------------- WHHHHHHHHHAAAAAAAAAAAAAAT',
					existingNotification
				);
			}

			const existingObjectIds = existingNotification
				? stringRepresentationToArray(existingNotification.object_ids)
				: [];
			const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...announcementIds]));

			const message = `You have ${updatedObjectIds.length} new announcements in an event you're attending!`;
			const pushNotificationPayload = { title: 'New Announcements', body: message };

			await handleNotification(
				tx,
				existingNotification as NotificationTypescriptType | null,
				attendeeUserId,
				eventId,
				NotificationType.ANNOUNCEMENT,
				updatedObjectIds,
				message,
				pushNotificationPayload
			);
		}
	});
}

async function notifyAttendeesOfFiles(eventId: string, fileIds: string[]): Promise<void> {
	if (!fileIds.length) return;

	const fileQuery = serverTriplitClient
		.query('files')
		.select(['id', 'uploader_id'])
		.where([['id', 'in', fileIds]])
		.build();

	const files = await serverTriplitClient.fetch(fileQuery);
	const fileUploaderMap = new Map(files.map((file) => [file.id, file.uploader_id]));

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		serverTriplitClient as TriplitClient,
		eventId,
		[Status.GOING, Status.MAYBE]
	);

	if (!attendingUserIds.length) return;

	await serverTriplitClient.transact(async (tx) => {
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
				tx,
				existingNotification as NotificationTypescriptType | null,
				attendeeUserId,
				eventId,
				NotificationType.FILES,
				updatedObjectIds,
				message,
				pushNotificationPayload
			);
		}
	});
}

async function notifyEventCreatorOfAttendees(
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!attendeeIds.length) return;

	const creatorQuery = serverTriplitClient
		.query('events')
		.select(['user_id', 'title'])
		.where([['id', '=', eventId]])
		.build();

	const [event] = await serverTriplitClient.fetch(creatorQuery);

	if (!event) return;

	const existingNotification = await getUnreadExistingNotification(
		event.user_id,
		eventId,
		NotificationType.ATTENDEES
	);

	if (event.user_id == 'qgo0paa9qnfcnof') {
		console.log(
			'-------------------------------------------------- WHHHHHHHHHAAAAAAAAAAAAAAT',
			existingNotification
		);
	}

	const existingObjectIds = existingNotification
		? stringRepresentationToArray(existingNotification.object_ids)
		: [];
	const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...attendeeIds]));

	const attendeeCount = updatedObjectIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	const pushNotificationPayload = { title: 'New Attendees', body: message };

	await serverTriplitClient.transact(async (tx) => {
		await handleNotification(
			tx,
			existingNotification as NotificationTypescriptType | null,
			event.user_id,
			eventId,
			NotificationType.ATTENDEES,
			updatedObjectIds,
			message,
			pushNotificationPayload
		);
	});
}

type PermissionValue = (typeof PermissionType)[keyof typeof PermissionType];

async function handleNotification(
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
		case NotificationType.ANNOUNCEMENT:
			requiredPermissions = [PermissionType.EVENT_ACTIVITY];
			break;
		case NotificationType.ATTENDEES:
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

		await triplitTx.update('notifications', existingNotification.id, (entity: any) => {
			entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
			entity.message = message;

			if (pushNotificationSent) {
				entity.num_push_notifications_sent = (entity.num_push_notifications_sent || 0) + 1;
			}
		});
		console.debug(`Updated notification for user ${recipientUserId}.`);
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
		console.debug(`Created a new notification for user ${recipientUserId}.`);
	}
}
