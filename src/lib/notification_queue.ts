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

	// Qeueue a notification to be processed
	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.ATTENDEES,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
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

	// Qeueue a notification to be processed
	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.TEMP_ATTENDEES,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
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

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.ANNOUNCEMENT,
		object_ids: JSON.stringify(announcementIds),
		object_ids_set: announcementIds
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
			object_ids: JSON.stringify(fileIds),
			object_ids_set: fileIds
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
	try {
		// Create a new notification queue entry
		await client.insert('notifications_queue', {
			user_id: userId,
			event_id: eventId,
			object_type: NotificationType.YOU_WERE_ADDED_AS_ADMIN,
			object_ids: JSON.stringify(userIdsBecomingAdmins),
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

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.NEW_MESSAGE,
		object_ids: JSON.stringify(messageIds),
		object_ids_set: messageIds
	});
}

/**
 * Create a new notification queue object for event invitations.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object (event creator).
 * @param eventId - The ID of the event.
 * @param userIds - List of user IDs who are being invited.
 */
export async function createNewEventInvitationNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	userIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(userIds)) {
		throw new Error('userIds in createNewEventInvitationNotificationQueueObject cannot be empty.');
	}

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.EVENT_INVITATION,
		object_ids: JSON.stringify(userIds),
		object_ids_set: userIds
	});
}

/**
 * Create a new notification queue object for event cancellation.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object (event creator).
 * @param eventId - The ID of the event.
 * @param attendeeIds - List of attendee IDs who should be notified.
 */
export async function createNewEventCancelledNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(attendeeIds)) {
		throw new Error(
			'attendeeIds in createNewEventCancelledNotificationQueueObject cannot be empty.'
		);
	}

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.EVENT_CANCELLED,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
	});
}

/**
 * Create a new notification queue object for event deletion.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object (event creator).
 * @param eventId - The ID of the event.
 * @param attendeeIds - List of attendee IDs who should be notified.
 */
export async function createNewEventDeletedNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(attendeeIds)) {
		throw new Error('attendeeIds in createNewEventDeletedNotificationQueueObject cannot be empty.');
	}

	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.EVENT_DELETED,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
	});
}

/**
 * Create a new notification queue object for temporary attendee event cancellation.
 * @param client - TriplitClient instance.
 * @param userId - The ID of the user creating the notification queue object (event creator).
 * @param eventId - The ID of the event.
 * @param tempAttendeeIds - List of temporary attendee IDs who should be notified.
 */
export async function createNewTempEventCancelledNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	tempAttendeeIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(tempAttendeeIds)) {
		throw new Error(
			'tempAttendeeIds in createNewTempEventCancelledNotificationQueueObject cannot be empty.'
		);
	}

	// For temporary attendees, we'll use a custom approach since they don't have user accounts
	// We'll create notification entries that the notification engine can handle
	await client.insert('notifications_queue', {
		user_id: userId,
		event_id: eventId,
		object_type: NotificationType.EVENT_CANCELLED,
		object_ids: JSON.stringify(tempAttendeeIds),
		object_ids_set: tempAttendeeIds
	});
}

/**
 * Create a new notification queue object for support messages.
 * This will notify all superuser accounts when a non-superuser sends a support message.
 * @param client - TriplitClient instance.
 * @param senderId - The ID of the user who sent the support message.
 * @param supportMessageId - The ID of the support message.
 */
export async function createNewSupportMessageNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	senderId: string,
	supportMessageId: string
): Promise<void> {
	if (!supportMessageId) {
		throw new Error(
			'supportMessageId in createNewSupportMessageNotificationQueueObject cannot be empty.'
		);
	}

	await client.insert('notifications_queue', {
		user_id: senderId,
		event_id: null, // Support messages don't belong to specific events
		object_type: NotificationType.SUPPORT_MESSAGE,
		object_ids: JSON.stringify([supportMessageId]),
		object_ids_set: [supportMessageId]
	});
}

/**
 * Create a new notification queue object for unseen invitations.
 * This notifies admins when invitations haven't been seen by attendees.
 * @param client - TriplitClient instance.
 * @param adminUserId - The ID of the admin user.
 * @param eventId - The ID of the event.
 * @param attendeeIds - List of attendee IDs with unseen invitations.
 */
export async function createNewUnseenInvitationsNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	adminUserId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(attendeeIds)) {
		throw new Error(
			'attendeeIds in createNewUnseenInvitationsNotificationQueueObject cannot be empty.'
		);
	}

	await client.insert('notifications_queue', {
		user_id: adminUserId,
		event_id: eventId,
		object_type: NotificationType.UNSEEN_INVITATIONS,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
	});
}

/**
 * Create a new notification queue object for unseen announcements.
 * This notifies admins when announcements haven't been seen by attendees.
 * @param client - TriplitClient instance.
 * @param adminUserId - The ID of the admin user.
 * @param eventId - The ID of the event.
 * @param attendeeIds - List of attendee IDs with unseen announcements.
 */
export async function createNewUnseenAnnouncementsNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	adminUserId: string,
	eventId: string,
	attendeeIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(attendeeIds)) {
		throw new Error(
			'attendeeIds in createNewUnseenAnnouncementsNotificationQueueObject cannot be empty.'
		);
	}

	await client.insert('notifications_queue', {
		user_id: adminUserId,
		event_id: eventId,
		object_type: NotificationType.UNSEEN_ANNOUNCEMENTS,
		object_ids: JSON.stringify(attendeeIds),
		object_ids_set: attendeeIds
	});
}

/**
 * Create a new notification queue object for organization join requests.
 * This notifies organization leaders when someone requests to join their organization.
 * @param client - TriplitClient instance.
 * @param requesterId - The ID of the user requesting to join.
 * @param organizationId - The ID of the organization.
 * @param joinRequestIds - List of join request IDs.
 */
export async function createNewOrganizationJoinRequestNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	requesterId: string,
	organizationId: string,
	joinRequestIds: string[]
): Promise<void> {
	if (!isNonEmptyArray(joinRequestIds)) {
		throw new Error(
			'joinRequestIds in createNewOrganizationJoinRequestNotificationQueueObject cannot be empty.'
		);
	}

	await client.insert('notifications_queue', {
		user_id: requesterId,
		event_id: organizationId, // Use event_id field for organization_id for join requests
		object_type: NotificationType.ORGANIZATION_JOIN_REQUEST,
		object_ids: JSON.stringify(joinRequestIds),
		object_ids_set: joinRequestIds
	});
}

/**
 * Create a new notification queue object for organization join request responses.
 * This notifies users when their join request has been approved or rejected.
 * @param client - TriplitClient instance.
 * @param reviewerUserId - The ID of the admin who reviewed the request.
 * @param organizationId - The ID of the organization.
 * @param joinRequestIds - List of join request IDs.
 * @param status - The status of the response ('approved' or 'rejected').
 */
export async function createNewOrganizationJoinResponseNotificationQueueObject(
	client: TriplitClient | WorkerClient | HttpClient,
	reviewerUserId: string,
	organizationId: string,
	joinRequestIds: string[],
	status: 'approved' | 'rejected'
): Promise<void> {
	if (!isNonEmptyArray(joinRequestIds)) {
		throw new Error(
			'joinRequestIds in createNewOrganizationJoinResponseNotificationQueueObject cannot be empty.'
		);
	}

	const notificationType =
		status === 'approved'
			? NotificationType.ORGANIZATION_JOIN_REQUEST_APPROVED
			: NotificationType.ORGANIZATION_JOIN_REQUEST_REJECTED;

	await client.insert('notifications_queue', {
		user_id: reviewerUserId,
		event_id: organizationId, // Use event_id field for organization_id for join requests
		object_type: notificationType,
		object_ids: JSON.stringify(joinRequestIds),
		object_ids_set: joinRequestIds
	});
}
