import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { NotificationType, Status } from '$lib/enums';
import type { AttendeeTypescriptType, FileTypescriptType, NotificationQueueEntry } from '$lib/types';

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

	const results = await client.fetch(query) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.user_id);
}

export async function validateAnnouncements(
	client: TriplitClient,
	announcementIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('announcement')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', announcementIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query) as AttendeeTypescriptType[];
	return results.map((announcement: AttendeeTypescriptType) => announcement.id);
}

export async function validateFiles(
	client: TriplitClient,
	fileIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('files')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', fileIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query) as FileTypescriptType[];
	return results.map((file: FileTypescriptType) => file.id);
}

export async function validateAttendees(
	client: TriplitClient,
	attendeeIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('attendees')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', attendeeIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}

export async function processNotification(notification: NotificationQueueEntry) {
	console.log(
		`Processing notification queue object created by user ${notification.user_id}:`,
		notification
	);

	// Parse object_ids into an array
	const objectIds = notification.object_ids.split(',');

	// Validate the object IDs based on object_type
	let validObjectIds: string[] = [];
	switch (notification.object_type) {
		case NotificationType.ANNOUNCEMENT:
			validObjectIds = await validateAnnouncements(
				serverTriplitClient as TriplitClient,
				objectIds,
				notification.event_id
			);
			break;
		case NotificationType.FILES:
			validObjectIds = await validateFiles(
				serverTriplitClient as TriplitClient,
				objectIds,
				notification.event_id
			);
			break;
		case NotificationType.ATTENDEES:
			validObjectIds = await validateAttendees(
				serverTriplitClient as TriplitClient,
				objectIds,
				notification.event_id
			);
			break;
		default:
			console.error(`Unknown object_type: ${notification.object_type}`);
			return;
	}

	if (validObjectIds.length === 0) {
		console.warn(`No valid objects found for notification ${notification.id}`);
		return;
	}

	// Send notifications based on the type
	switch (notification.object_type) {
		case NotificationType.ANNOUNCEMENT:
			await notifyAttendeesOfAnnouncements(notification.user_id, validObjectIds);
			break;
		case NotificationType.FILES:
			await notifyAttendeesOfFiles(notification.user_id, validObjectIds);
			break;
		case NotificationType.ATTENDEES:
			await notifyEventCreatorOfAttendees(notification.event_id, validObjectIds);
			break;
	}

	// Mark the notification as sent
	await serverTriplitClient.update('notifications_queue', notification.id, async (entity) => {
		entity.sent_at = new Date();
	});

	console.log(`Notification ${notification.id} marked as sent.`);
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

	if (!attendingUserIds.length) return;

	const message = `You have ${announcementIds.length} new announcements in an event you're attending!`;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
			await tx.insert('notifications', {
				event_id: eventId,
				user_id: attendeeUserId,
				message,
				object_type: NotificationType.ANNOUNCEMENT,
				object_ids: announcementIds.join(',')
			});
		}
	});

	console.log(`Created notifications for ${attendingUserIds.length} attendees.`);
}

async function notifyAttendeesOfFiles(eventId: string, fileIds: string[]): Promise<void> {
	if (!fileIds.length) return;

	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		serverTriplitClient as TriplitClient,
		eventId,
		[Status.GOING, Status.MAYBE]
	);

	if (!attendingUserIds.length) return;

	const message = `You have ${fileIds.length} new files in an event you're attending!`;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
			await tx.insert('notifications', {
				event_id: eventId,
				user_id: attendeeUserId,
				message,
				object_type: NotificationType.FILES,
				object_ids: fileIds.join(',')
			});
		}
	});

	console.log(`Created notifications for ${attendingUserIds.length} attendees.`);
}

async function notifyEventCreatorOfAttendees(
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!attendeeIds.length) return;

	// Fetch event details to identify the creator and event title
	const creatorQuery = serverTriplitClient
		.query('events')
		.select(['user_id', 'title'])
		.where([['id', '=', eventId]])
		.build();

	const [event] = await serverTriplitClient.fetch(creatorQuery);

	if (!event) return;

	// Construct the notification message with correct pluralization
	const attendeeCount = attendeeIds.length;
	const attendeeWord = attendeeCount === 1 ? 'attendee' : 'attendees';
	const message = `${attendeeCount} ${attendeeWord} ${attendeeCount === 1 ? 'is' : 'are'} now attending your event "${event.title}".`;

	// Insert the notification directly
	await serverTriplitClient.insert('notifications', {
		event_id: eventId,
		user_id: event.user_id, // Notification goes to the event creator
		message,
		object_type: NotificationType.ATTENDEES,
		object_ids: attendeeIds.join(',')
	});

	console.log(`Created a notification for event creator ${event.user_id}.`);
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
	attendeeIds: string[]
) {
	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(attendeeIds);

	// Qeueue a notification to be processed
	await client.insert('notifications_queue', {
		user_id: userId,
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
	announcementIds: string[]
): Promise<void> {
	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(announcementIds);

	await client.insert('notifications_queue', {
		user_id: userId,
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
	fileIds: string[]
): Promise<void> {
	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(fileIds);

	await client.insert('notifications_queue', {
		user_id: userId,
		object_type: NotificationType.FILES,
		object_ids: objectIds
	});
}
