import { TaskName, NotificationType } from '$lib/enums';
import { triplitHttpClient } from '$lib/server/triplit';
import { getTaskLockState, updateTaskLockState } from '../tasks';
import {
	createNewUnseenInvitationsNotificationQueueObject,
	createNewUnseenAnnouncementsNotificationQueueObject
} from '$lib/notification_queue';

/**
 * Check for unseen invitations and notify admins if needed
 */
export const runUnseenInvitationsCheck = async () => {
	const taskName = TaskName.CHECK_UNSEEN_INVITATIONS;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task runUnseenInvitationsCheck is already running. Skipping execution.');
			return;
		}
		await updateTaskLockState(taskName, true);

		// Get all events that are in the future
		const now = new Date();
		const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const events = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('events')
				.Where([['start_time', '>', tomorrow]]) // Only events more than 1 day away
				.Select(['id', 'title', 'start_time', 'created_at'])
		);

		for (const event of events) {
			await checkUnseenInvitationsForEvent(event.id, event.start_time, event.created_at);
		}
	} catch (error) {
		console.error('Error running unseen invitations check:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('failed to release task lock', e);
		}
	}
};

/**
 * Check for unseen announcements and notify admins if needed
 */
export const runUnseenAnnouncementsCheck = async () => {
	const taskName = TaskName.CHECK_UNSEEN_ANNOUNCEMENTS;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task runUnseenAnnouncementsCheck is already running. Skipping execution.');
			return;
		}
		await updateTaskLockState(taskName, true);

		// Get all events that are in the future
		const now = new Date();
		const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

		const events = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('events')
				.Where([['start_time', '>', tomorrow]]) // Only events more than 1 day away
				.Select(['id', 'title', 'start_time'])
		);

		for (const event of events) {
			await checkUnseenAnnouncementsForEvent(event.id, event.start_time);
		}
	} catch (error) {
		console.error('Error running unseen announcements check:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('failed to release task lock', e);
		}
	}
};

/**
 * Check for unseen invitations for a specific event
 */
async function checkUnseenInvitationsForEvent(
	eventId: string,
	eventStartTime: Date,
	eventCreatedAt: Date
) {
	// Calculate the notification time: (event_created_date - event_date) / 2
	// But ensure it's at least 1 day after creation and at least 1 day before event
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const eventCreated = new Date(eventCreatedAt);
	const eventStart = new Date(eventStartTime);

	const timeDiff = eventStart.getTime() - eventCreated.getTime();
	const halfwayPoint = new Date(eventCreated.getTime() + timeDiff / 2);

	// Ensure at least 1 day after creation and at least 1 day before event
	const earliestNotificationTime = new Date(eventCreated.getTime() + 24 * 60 * 60 * 1000);
	const latestNotificationTime = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

	let notificationTime = halfwayPoint;
	if (notificationTime < earliestNotificationTime) {
		notificationTime = earliestNotificationTime;
	}
	if (notificationTime > latestNotificationTime) {
		notificationTime = latestNotificationTime;
	}

	// Only proceed if we're past the notification time
	if (now < notificationTime) {
		return;
	}

	// Get all invitation notifications for this event
	const invitationNotifications = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('notifications')
			.Where([
				['event_id', '=', eventId],
				['object_type', '=', NotificationType.EVENT_INVITATION]
			])
			.Select(['id', 'user_id', 'created_at'])
	);

	if (!invitationNotifications.length) {
		return;
	}

	// Get all attendees for this event
	const attendees = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('attendees')
			.Where([['event_id', '=', eventId]])
			.Select(['id', 'user_id'])
	);

	const attendeesByUserId = new Map(attendees.map((att) => [att.user_id, att.id]));

	// Check which invitations haven't been seen
	const unseenAttendeeIds: string[] = [];

	for (const notification of invitationNotifications) {
		const attendeeId = attendeesByUserId.get(notification.user_id);
		if (!attendeeId) continue;

		// Check if this invitation has been seen
		const seenRecord = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('seen_invitations')
				.Where([
					['attendee_id', '=', attendeeId],
					['notification_id', '=', notification.id]
				])
				.Select(['id'])
		);

		if (!seenRecord.length) {
			unseenAttendeeIds.push(attendeeId);
		}
	}

	if (unseenAttendeeIds.length > 0) {
		// Get event admins to notify
		const eventAdmins = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('event_admins')
				.Where([['event_id', '=', eventId]])
				.Select(['user_id'])
		);

		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.Where([['id', '=', eventId]])
				.Select(['user_id'])
		);

		// Include event creator as admin
		const adminUserIds = new Set([
			...eventAdmins.map((admin) => admin.user_id),
			...(event?.user_id ? [event.user_id] : [])
		]);

		// Create notification for each admin
		for (const adminUserId of adminUserIds) {
			await createNewUnseenInvitationsNotificationQueueObject(
				triplitHttpClient,
				adminUserId,
				eventId,
				unseenAttendeeIds
			);
		}

		console.log(
			`Created unseen invitations notification for event ${eventId}: ${unseenAttendeeIds.length} attendees haven't seen their invitations`
		);
	}
}

/**
 * Check for unseen announcements for a specific event
 */
async function checkUnseenAnnouncementsForEvent(eventId: string, eventStartTime: Date) {
	// Get all announcements for this event
	const announcements = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('announcement')
			.Where([['event_id', '=', eventId]])
			.Select(['id', 'created_at'])
	);

	if (!announcements.length) {
		return;
	}

	const now = new Date();
	const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
	const eventStart = new Date(eventStartTime);

	// Get all attendees for this event
	const attendees = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('attendees')
			.Where([['event_id', '=', eventId]])
			.Select(['id', 'user_id'])
	);

	for (const announcement of announcements) {
		const announcementCreated = new Date(announcement.created_at);

		// Calculate notification time: (announcement_created_date - event_date) / 2
		const timeDiff = eventStart.getTime() - announcementCreated.getTime();
		const halfwayPoint = new Date(announcementCreated.getTime() + timeDiff / 2);

		// Ensure at least 1 day after announcement creation and at least 1 day before event
		const earliestNotificationTime = new Date(announcementCreated.getTime() + 24 * 60 * 60 * 1000);
		const latestNotificationTime = new Date(eventStart.getTime() - 24 * 60 * 60 * 1000);

		let notificationTime = halfwayPoint;
		if (notificationTime < earliestNotificationTime) {
			notificationTime = earliestNotificationTime;
		}
		if (notificationTime > latestNotificationTime) {
			notificationTime = latestNotificationTime;
		}

		// Only proceed if we're past the notification time
		if (now < notificationTime) {
			continue;
		}

		// Check which attendees haven't seen this announcement
		const unseenAttendeeIds: string[] = [];

		for (const attendee of attendees) {
			// Check if this attendee has seen this announcement
			const seenRecord = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('seen_announcements')
					.Where([
						['attendee_id', '=', attendee.id],
						['announcement_id', '=', announcement.id]
					])
					.Select(['id'])
			);

			if (!seenRecord.length) {
				unseenAttendeeIds.push(attendee.id);
			}
		}

		if (unseenAttendeeIds.length > 0) {
			// Get event admins to notify
			const eventAdmins = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('event_admins')
					.Where([['event_id', '=', eventId]])
					.Select(['user_id'])
			);

			const event = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('events')
					.Where([['id', '=', eventId]])
					.Select(['user_id'])
			);

			// Include event creator as admin
			const adminUserIds = new Set([
				...eventAdmins.map((admin) => admin.user_id),
				...(event?.user_id ? [event.user_id] : [])
			]);

			// Create notification for each admin
			for (const adminUserId of adminUserIds) {
				await createNewUnseenAnnouncementsNotificationQueueObject(
					triplitHttpClient,
					adminUserId,
					eventId,
					unseenAttendeeIds
				);
			}

			console.log(
				`Created unseen announcements notification for event ${eventId}, announcement ${announcement.id}: ${unseenAttendeeIds.length} attendees haven't seen it`
			);
		}
	}
}
