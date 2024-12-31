import { TriplitClient } from '@triplit/client';
import { NotificationType, NOTIFY_OF_ATTENDING_STATUS_CHANGE, Status } from '$lib/enums';
import type { NotificationQueueEntry, NotificationTypescriptType } from '$lib/types';
import { stringRepresentationToArray } from '$lib/utils';
import { handleNotification } from '$lib/webpush';
import {
	getAttendeeUserIdsOfEvent,
	serverTriplitClient,
	validateAnnouncements,
	validateAttendees,
	validateFiles
} from './triplit';

export const runNotificationProcessor = async () => {
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
};

export async function processNotificationQueue(notificationQueueEntry: NotificationQueueEntry) {
	console.log(
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
		// TODO; delete objects
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

	console.log(`Notification ${notificationQueueEntry.id} marked as sent.`);
}

async function getExistingNotification(
	attendeeUserId: string,
	eventId: string,
	object_type: NotificationType
) {
	const query = serverTriplitClient
		.query('notifications')
		.where([
			['user_id', '=', attendeeUserId],
			['event_id', '=', eventId],
			['object_type', '=', object_type],
			['seen_at', '=', null]
		])
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
			const existingNotification = await getExistingNotification(
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

			const existingNotification = await getExistingNotification(
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

	const existingNotification = await getExistingNotification(
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
