import { NotificationPermissions, NotificationType, Status, TaskName } from '$lib/enums';
import type { PushNotificationPayload } from '$lib/types';
import { Notification, bulkNotifyUsers, bulkPersistNotifications } from './engine';
import { getAttendeeUserIdsOfEvent, triplitHttpClient } from '../triplit';
import { and } from '@triplit/client';
import { getTaskLockState, updateTaskLockState } from '../tasks';

export const runReminderNotificationTask = async () => {
	const taskName = TaskName.SEND_REMINDER_NOTIFICATIONS;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug('Task is already running. Skipping execution.');
			return;
		} else {
			console.debug('Start reminder notification task.');
		}
		await updateTaskLockState(taskName, true);

		// NOTE: choosing to NOT set a start time for the filtering in order
		// to make sure notifications eventually get sent if issues occurred in infra.
		// Filtering can then be done later to decide or not to drop reminders.
		const now = new Date();
		const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

		const query = triplitHttpClient.query('event_reminders').Where(
			and([
				['send_at', '<=', inOneHour],
				['sent_at', 'isDefined', false],
				['dropped', '=', false]
			])
		);

		// Fetch the events
		const reminders = await triplitHttpClient.fetch(query);

		// Process each reminder
		for (const reminder of reminders) {
			const sendAtWithLeadTime = new Date(
				reminder.send_at.getTime() +
					reminder.lead_time_in_hours_before_event_starts * 60 * 60 * 1000
			);

			if (sendAtWithLeadTime < now) {
				// Drop the reminder if the condition is met
				console.error(`Dropping reminder ${reminder.id} as it is past the lead time.`);
				await markReminderAsDropped(reminder.id);
				continue;
			}

			await sendReminderNotifications(
				reminder.id,
				reminder.event_id,
				reminder.text,
				reminder.target_attendee_statuses
			);
		}
	} catch (error) {
		console.error('Error running reminder notification task:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('Failed to release task lock', e);
		}
	}
};

async function markReminderAsDropped(reminderId: string): Promise<void> {
	await triplitHttpClient.update('event_reminders', reminderId, (entity) => {
		entity.sent_at = new Date(); // Mark as sent to avoid reprocessing
		entity.dropped = true; // Optionally, add a field to mark as dropped
	});
	console.debug(`Marked reminder ${reminderId} as dropped.`);
}

async function sendReminderNotifications(
	reminderId: string,
	eventId: string,
	reminderText: string,
	reminderTargetAttendeeStatuses: Set<string>
): Promise<void> {
	// Convert Set<string> to Status[]
	const targetStatuses: Status[] = Array.from(reminderTargetAttendeeStatuses).map((status) => {
		// Ensure the status is a valid enum value
		if (Object.values(Status).includes(status as Status)) {
			return status as Status;
		} else {
			throw new Error(`Invalid status: ${status}`);
		}
	});

	// Get only users who have the permission enabled, and send on all granted delivery channels.
	const attendingUserIds = await getAttendeeUserIdsOfEvent(
		eventId,
		targetStatuses,
		NotificationType.REMINDER
	);

	if (!attendingUserIds.length) return;

	// Create Notification objects
	const notifications: Notification[] = attendingUserIds.map((attendeeUserId: string) => {
		const pushNotificationPayload: PushNotificationPayload = {
			title: 'Event Reminder',
			body: reminderText
		};

		return new Notification(
			eventId,
			attendeeUserId,
			reminderText,
			NotificationType.REMINDER,
			[reminderId],
			new Set([reminderId]),
			pushNotificationPayload,
			[NotificationPermissions.event_reminders]
		);
	});

	// Persist notifications
	await bulkPersistNotifications(notifications);

	// Bulk notify end-users with these objects
	await bulkNotifyUsers(notifications);

	await triplitHttpClient.update('event_reminders', reminderId, async (entity) => {
		entity.sent_at = new Date();
	});
	console.debug(`Sent reminder notifications for event ${eventId}.`);
}
