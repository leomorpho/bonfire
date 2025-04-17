import { and, type HttpClient, type TriplitClient } from '@triplit/client';
import { isNonEmptyArray } from './utils';
import { NotificationType } from './enums';
import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Create a new notification queue object for attendance.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param attendeeIds - List of attendance IDs.
 */
export async function createNewAttendanceNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
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
		object_ids: objectIds,
		object_ids_set: new Set(attendeeIds)
	});
}

/**
 * Create a new notification queue object for attendance.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param attendeeIds - List of attendance IDs.
 */
export async function createNewTemporaryAttendanceNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
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
		object_type: NotificationType.TEMP_ATTENDEES,
		object_ids: objectIds,
		object_ids_set: new Set(attendeeIds)
	});
}

/**
 * Create a new notification queue object for announcements.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param announcementIds - List of announcement IDs.
 */
export async function createNewAnnouncementNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
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
		object_ids: objectIds,
		object_ids_set: new Set(announcementIds)
	});
}

/**
 * Create a new notification queue object for files.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param fileIds - List of file IDs.
 */
export async function createNewFileNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
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

	// Try to find an existing notification queue object with the same userId, eventId, and object_type
	const existingQueue = await client.fetch(
		client
			.query('notifications_queue')
			.Where(
				and([
					['user_id', '=', userId],
					['event_id', '=', eventId],
					['object_type', '=', NotificationType.FILES]
				])
			)
			.Select(['id', 'object_ids', 'object_ids_set'])
	);

	if (existingQueue && existingQueue.length > 0) {
		// If an existing object is found, merge the new objectIds with the old ones
		const existingObjectIds = JSON.parse(existingQueue[0].object_ids) as string[];
		const updatedSet = new Set([...existingObjectIds, ...fileIds]);
		const updatedObjectIds = JSON.stringify([...updatedSet]);

		// Update the existing record with the new objectIds
		await client.update('notifications_queue', existingQueue[0].id, async (entity) => {
			entity.object_ids = updatedObjectIds;
			entity.object_ids_set = new Set([...updatedSet, ...entity.object_ids_set]);
		});
	} else {
		// If no existing object is found, create a new notification queue object
		await client.insert('notifications_queue', {
			user_id: userId,
			event_id: eventId,
			object_type: NotificationType.FILES,
			object_ids: objectIds,
			object_ids_set: new Set(fileIds)
		});
	}
}

/**
 * Create a new notification queue object for admin assignments.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param eventId - The ID of the event.
 * @param adminIds - List of attendee IDs who are now admins.
 */
export async function createNewAdminNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	userIdsBecomingAdmins: string[]
): Promise<void> {
	if (!isNonEmptyArray(userIdsBecomingAdmins)) {
		throw new Error(
			'attendee IDs of admins in createNewAdminNotificationQueueObject cannot be empty.'
		);
	}
	// Convert admin IDs to JSON string
	const objectIds = JSON.stringify(userIdsBecomingAdmins);

	try {
		// Check if a notification queue entry already exists for this event and user
		// const existingQueue = await client.fetch(
		// 	client
		// 		.query('notifications_queue')
		// 		.Where(
		// 			and([
		// 				['user_id', '=', userId],
		// 				['event_id', '=', eventId],
		// 				['object_type', '=', NotificationType.ADMIN_ADDED]
		// 			])
		// 		)
		// 		.Select(['id', 'object_ids'])
		//
		// );

		// if (existingQueue && existingQueue.length > 0) {
		// 	// Merge new admin IDs with existing ones
		// 	const existingObjectIds = JSON.parse(existingQueue[0].object_ids) as string[];
		// 	const updatedObjectIds = JSON.stringify([...new Set([...existingObjectIds, ...userIdsBecomingAdmins])]);

		// 	// Update the existing notification queue entry
		// 	await client.update('notifications_queue', existingQueue[0].id, async (entity) => {
		// 		entity.object_ids = updatedObjectIds;
		// 	});
		// } else {
		// Create a new notification queue entry
		await client.insert('notifications_queue', {
			user_id: userId,
			event_id: eventId,
			object_type: NotificationType.ADMIN_ADDED,
			object_ids: objectIds,
			object_ids_set: userIdsBecomingAdmins
		});
		// }
	} catch (e) {
		console.log('failed to create notification queue object for admin notification', e);
	}
}

/**
 * Create a new message queue object for messages.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object.
 * @param messageIds - List of message IDs.
 */
export async function createNewMessageNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	messageIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(messageIds)) {
		throw new Error('messageIds in createNewMessageNotificationQueueObject cannot be empty.');
	}

	// TODO: check that announcementIds points to real objects

	// Stringify the list of IDs, even if it's a single item
	const objectIds = JSON.stringify(messageIds);

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.NEW_MESSAGE,
		object_ids: objectIds,
		object_ids_set: messageIds
	});
}
