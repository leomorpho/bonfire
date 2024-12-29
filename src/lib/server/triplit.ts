import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { NotificationType, Status } from '$lib/enums';
import type {
	AttendeeTypescriptType,
	FileTypescriptType,
	NotificationQueueEntry
} from '$lib/types';
import {
	arrayToStringRepresentation,
	isNonEmptyArray,
	stringRepresentationToArray
} from '$lib/utils';

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getAttendeeUserIdsOfEvent(
	client: TriplitClient,
	eventId: string,
	statuses: Status[]
): Promise<string[]> {
	const query = client
		.query('attendees')
		.select(['user_id'])
		.where([
			['event_id', '=', eventId],
			['status', 'in', statuses]
		])
		.build();

	const results = (await client.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.user_id);
}

export async function validateAnnouncements(
	client: TriplitClient,
	announcementIds: string[]
): Promise<string[]> {
	const query = client
		.query('announcement')
		.select(['id'])
		.where([['id', 'in', announcementIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as AttendeeTypescriptType[];

	return results.map((announcement: AttendeeTypescriptType) => announcement.id);
}

export async function validateFiles(client: TriplitClient, fileIds: string[]): Promise<string[]> {
	const query = client
		.query('files')
		.select(['id'])
		.where([['id', 'in', fileIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as FileTypescriptType[];
	return results.map((file: FileTypescriptType) => file.id);
}

export async function validateAttendees(
	client: TriplitClient,
	attendeeIds: string[]
): Promise<string[]> {
	const query = client
		.query('attendees')
		.select(['id'])
		.where([['id', 'in', attendeeIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}

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

async function notifyAttendeesOfAnnouncements(
	eventId: string,
	announcementIds: string[]
): Promise<void> {
	if (!announcementIds.length) return;

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		serverTriplitClient as TriplitClient,
		eventId,
		[Status.GOING, Status.MAYBE]
	);
	console.log('notifyAttendeesOfAnnouncements attendingUserIds', attendingUserIds);

	if (!attendingUserIds.length) return;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
			// Check if the user already has an unseen notification of this type for this event
			const existingNotificationQuery = serverTriplitClient
				.query('notifications')
				.where([
					['user_id', '=', attendeeUserId],
					['event_id', '=', eventId],
					['object_type', '=', NotificationType.ANNOUNCEMENT],
					['seen_at', '=', null]
				])
				.build();

			const [existingNotification] = await serverTriplitClient.fetch(existingNotificationQuery);

			if (existingNotification) {
				// Parse the existing object IDs and aggregate with the new announcement IDs
				const existingObjectIds = stringRepresentationToArray(existingNotification.object_ids);
				const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...announcementIds])); // Ensure uniqueness

				// Update the existing notification with the aggregated announcement IDs
				const updatedMessage = `You have ${updatedObjectIds.length} new announcements in an event you're attending!`;

				await tx.update('notifications', existingNotification.id, (entity) => {
					entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
					entity.message = updatedMessage;
				});

				console.log(`Updated notification for user ${attendeeUserId}.`);
			} else {
				// Create a new notification
				const message = `You have ${announcementIds.length} new announcements in an event you're attending!`;

				await tx.insert('notifications', {
					event_id: eventId,
					user_id: attendeeUserId,
					message,
					object_type: NotificationType.ANNOUNCEMENT,
					object_ids: arrayToStringRepresentation(announcementIds)
				});

				console.log(`Created a new notification for user ${attendeeUserId}.`);
			}
		}
	});
}

async function notifyAttendeesOfFiles(eventId: string, fileIds: string[]): Promise<void> {
	if (!fileIds.length) return;

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		serverTriplitClient as TriplitClient,
		eventId,
		[Status.GOING, Status.MAYBE]
	);

	if (!attendingUserIds.length) return;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
			// Check if the user already has an unseen notification of this type for this event
			const existingNotificationQuery = serverTriplitClient
				.query('notifications')
				.where([
					['user_id', '=', attendeeUserId],
					['event_id', '=', eventId],
					['object_type', '=', NotificationType.FILES],
					['seen_at', '=', null]
				])
				.build();

			const [existingNotification] = await serverTriplitClient.fetch(existingNotificationQuery);

			if (existingNotification) {
				// Parse the existing object IDs and aggregate with the new file IDs
				const existingObjectIds = stringRepresentationToArray(existingNotification.object_ids);
				const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...fileIds])); // Ensure uniqueness

				// Update the existing notification with the aggregated file IDs
				const updatedMessage = `You have ${updatedObjectIds.length} new files in an event you're attending!`;

				await tx.update('notifications', existingNotification.id, (entity) => {
					entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
					entity.message = updatedMessage;
				});

				console.log(`Updated notification for user ${attendeeUserId}.`);
			} else {
				// Create a new notification
				const message = `You have ${fileIds.length} new files in an event you're attending!`;

				await tx.insert('notifications', {
					event_id: eventId,
					user_id: attendeeUserId,
					message,
					object_type: NotificationType.FILES,
					object_ids: arrayToStringRepresentation(fileIds)
				});

				console.log(`Created a new notification for user ${attendeeUserId}.`);
			}
		}
	});
}

async function notifyEventCreatorOfAttendees(
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!attendeeIds.length) return;

	console.log('notifyEventCreatorOfAttendees attendeeIds', attendeeIds);

	// Fetch event details to identify the creator and event title
	const creatorQuery = serverTriplitClient
		.query('events')
		.select(['user_id', 'title'])
		.where([['id', '=', eventId]])
		.build();

	const [event] = await serverTriplitClient.fetch(creatorQuery);

	console.log('notifyEventCreatorOfAttendees event', event);

	if (!event) return;

	// Check if there is an existing unseen notification of the same type for the event
	const existingNotificationQuery = serverTriplitClient
		.query('notifications')
		.where([
			['user_id', '=', event.user_id],
			['event_id', '=', eventId],
			['object_type', '=', NotificationType.ATTENDEES],
			['seen_at', '=', null]
		])
		.build();

	const [existingNotification] = await serverTriplitClient.fetch(existingNotificationQuery);

	if (existingNotification) {
		// Parse the existing object IDs and aggregate with the new attendee IDs
		const existingObjectIds = stringRepresentationToArray(existingNotification.object_ids);
		const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...attendeeIds])); // Ensure uniqueness

		// Update the existing notification with the aggregated attendee IDs
		const attendeeCount = updatedObjectIds.length;
		const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
		const updatedMessage = `${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

		await serverTriplitClient.update('notifications', existingNotification.id, (entity) => {
			entity.object_ids = arrayToStringRepresentation(updatedObjectIds);
			entity.message = updatedMessage;
		});

		console.log(`Updated existing notification for event creator ${event.user_id}.`);
	} else {
		// Construct the notification message with correct pluralization
		const attendeeCount = attendeeIds.length;
		const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
		const message = `${attendeeCount} new ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

		// Insert the notification directly
		await serverTriplitClient.insert('notifications', {
			event_id: eventId,
			user_id: event.user_id, // Notification goes to the event creator
			message,
			object_type: NotificationType.ATTENDEES,
			object_ids: arrayToStringRepresentation(attendeeIds)
		});

		console.log(`Created a new notification for event creator ${event.user_id}.`);
	}
}

/**
 * Create a new notification queue object for attendance.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param attendeeIds - List of attendance IDs.
 */
export async function createNewAttendanceNotificationQueueObject(
	client: TriplitClient,
	userId: string,
	eventId: string,
	attendeeIds: string[]
) {
	if (!isNonEmptyArray(attendeeIds)) {
		throw new Error('attendeeIds in createNewAttendanceNotificationQueueObject cannot be empty.');
	}

	// TODO: check that attendeeIds points to real objects

	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(attendeeIds);

	// Qeueue a notification to be processed
	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.ATTENDEES,
		object_ids: objectIds
	});
}

/**
 * Create a new notification queue object for announcements.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param announcementIds - List of announcement IDs.
 */
export async function createNewAnnouncementNotificationQueueObject(
	client: TriplitClient,
	userId: string,
	eventId: string,
	announcementIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(announcementIds)) {
		throw new Error(
			'announcementIds in createNewAnnouncementNotificationQueueObject cannot be empty.'
		);
	}

	// TODO: check that announcementIds points to real objects

	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(announcementIds);

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.ANNOUNCEMENT,
		object_ids: objectIds
	});
}

/**
 * Create a new notification queue object for files.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param fileIds - List of file IDs.
 */
export async function createNewFileNotificationQueueObject(
	client: TriplitClient,
	userId: string,
	eventId: string,
	fileIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(fileIds)) {
		throw new Error('fileIds in createNewFileNotificationQueueObject cannot be empty.');
	}

	// TODO: check that fileIds points to real objects

	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(fileIds);

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.FILES,
		object_ids: objectIds
	});
}
