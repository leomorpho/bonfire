import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import {
	NotificationType,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	PermissionType,
	Status
} from '$lib/enums';
import type {
	AttendeeTypescriptType,
	FileTypescriptType,
	NotificationQueueEntry
} from '$lib/types';
import { stringRepresentationToArray } from '$lib/utils';
import { handleNotification } from '$lib/webpush';

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getAttendeeUserIdsOfEvent(
	client: TriplitClient,
	eventId: string,
	statuses: Status[],
	excludeCreator: boolean = false
): Promise<string[]> {
	// Fetch the event to get the creator's user ID if excludeCreator is true
	let creatorUserId: string | null = null;
	if (excludeCreator) {
		const eventQuery = client
			.query('events')
			.select(['user_id'])
			.where([['id', '=', eventId]])
			.build();

		const [event] = await client.fetch(eventQuery);
		creatorUserId = event?.user_id || null;
	}

	// Build the attendees query
	const attendeeQueryConditions: any[] = [
		['event_id', '=', eventId],
		['status', 'in', statuses]
	];

	// Add condition to exclude the creator if applicable
	if (excludeCreator && creatorUserId) {
		attendeeQueryConditions.push(['user_id', '!=', creatorUserId]);
	}

	const query = client
		.query('attendees')
		.select(['user_id'])
		.where(attendeeQueryConditions)
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
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		true // Do not notify announcement creator, i.e., event creator
	);

	if (!attendingUserIds.length) return;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendeeUserId of attendingUserIds) {
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

			const existingObjectIds = existingNotification
				? stringRepresentationToArray(existingNotification.object_ids)
				: [];
			const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...announcementIds]));

			const message = `You have ${updatedObjectIds.length} new announcements in an event you're attending!`;
			const pushNotificationPayload = { title: 'New Announcements', body: message };

			await handleNotification(
				tx,
				existingNotification,
				attendeeUserId,
				eventId,
				NotificationType.ANNOUNCEMENT,
				updatedObjectIds,
				message,
				pushNotificationPayload,
				[PermissionType.EVENT_ACTIVITY]
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

			const existingObjectIds = existingNotification
				? stringRepresentationToArray(existingNotification.object_ids)
				: [];
			const updatedObjectIds = Array.from(new Set([...existingObjectIds, ...filteredFileIds]));

			const message = `You have ${updatedObjectIds.length} new files in an event you're attending!`;
			const pushNotificationPayload = { title: 'New Files', body: message };

			await handleNotification(
				tx,
				existingNotification,
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

	const existingNotificationQuery = serverTriplitClient
		.query('notifications')
		.where([
			['user_id', '=', event.user_id],
			['event_id', '=', eventId],
			['object_type', '=', NotificationType.ATTENDEES],
			['seen_at', '=', null]
		])
		.build();

	const existingNotification = await serverTriplitClient.fetchOne(existingNotificationQuery);

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
			existingNotification,
			event.user_id,
			eventId,
			NotificationType.ATTENDEES,
			updatedObjectIds,
			message,
			pushNotificationPayload
		);
	});
}
