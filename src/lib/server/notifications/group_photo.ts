import { NotificationPermissions, NotificationType, Status, TaskName } from '$lib/enums';
import type { PushNotificationPayload } from '$lib/types';
import { Notification, bulkNotifyUsers, bulkPersistNotifications } from './notification_engine';
import { triplitHttpClient } from '../triplit';
import { and } from '@triplit/client';
import { getTaskLockState, updateTaskLockState } from '../tasks';

export const runGroupPhotoNotificationTask = async () => {
	const taskName = TaskName.SEND_GROUP_PHOTO_NOTIFICATIONS;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task runGroupPhotoNotificationTask is already running. Skipping execution.');
			return;
		} else {
			console.debug('Start group photo notification task.');
		}
		await updateTaskLockState(taskName, true);

		const now = new Date();
		const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

		// Query for events that started 30 minutes ago and are still ongoing (or have no end time)
		const eventsQuery = triplitHttpClient.query('events').Where(
			and([
				['start_time', '<=', thirtyMinutesAgo],
				['start_time', '>=', new Date(thirtyMinutesAgo.getTime() - 20 * 60 * 1000)] // Within last 20 minutes to avoid processing old events
			])
		);

		const events = await triplitHttpClient.fetch(eventsQuery);

		for (const event of events) {
			// Check if event is still ongoing (no end time or end time is in the future)
			const isOngoing = !event.end_time || event.end_time > now;
			if (!isOngoing) {
				continue;
			}

			// Count attending users (not temporary attendees)
			const attendeesQuery = triplitHttpClient.query('attendees').Where(
				and([
					['event_id', '=', event.id],
					['status', '=', Status.GOING]
				])
			);

			const attendees = await triplitHttpClient.fetch(attendeesQuery);

			// Only send notifications for events with more than 5 attendees
			if (attendees.length <= 5) {
				continue;
			}

			// Check if we've already sent notifications for this event to these attendees
			const alreadySentQuery = triplitHttpClient
				.query('group_photo_notifications_sent')
				.Where([['event_id', '=', event.id]]);
			const alreadySent = await triplitHttpClient.fetch(alreadySentQuery);
			const alreadySentAttendeeIds = new Set(alreadySent.map((n) => n.attendee_id));

			// Filter attendees who haven't received notifications yet
			const attendeesToNotify = attendees.filter(
				(attendee) => !alreadySentAttendeeIds.has(attendee.id)
			);

			if (attendeesToNotify.length === 0) {
				continue;
			}

			await sendGroupPhotoNotifications(event.id, attendeesToNotify);
		}
	} catch (error) {
		console.error('Error running group photo notification task:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('Failed to release task lock', e);
		}
	}
};

async function sendGroupPhotoNotifications(eventId: string, attendees: any[]): Promise<void> {
	// Create Notification objects
	const notifications: Notification[] = attendees.map((attendee) => {
		const pushNotificationPayload: PushNotificationPayload = {
			title: 'Time for a group photo! 📸',
			body: 'Capture the memories and share them on Bonfire!'
		};

		return new Notification(
			eventId,
			attendee.user_id,
			'Time for a group photo! Capture the memories and share them on Bonfire!',
			NotificationType.GROUP_PHOTO,
			[eventId],
			new Set([eventId]),
			pushNotificationPayload,
			[NotificationPermissions.event_activity]
		);
	});

	// Persist notifications
	await bulkPersistNotifications(notifications);

	// Bulk notify end-users with these objects
	await bulkNotifyUsers(notifications);

	// Mark notifications as sent for each attendee
	for (const attendee of attendees) {
		await triplitHttpClient.insert('group_photo_notifications_sent', {
			event_id: eventId,
			attendee_id: attendee.id
		});
	}

	console.debug(
		`Sent group photo notifications for event ${eventId} to ${attendees.length} attendees.`
	);
}
