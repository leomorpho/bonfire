import type { TriplitClient } from "@triplit/client";
import { isNonEmptyArray } from "./utils";
import { NotificationType } from "./enums";

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
		object_ids: objectIds,
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
