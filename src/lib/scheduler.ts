import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import { getAttendeeUserIdsOfEvent, serverTriplitClient, validateAnnouncements, validateAttendees, validateFiles } from './server/triplit';
import { Status } from './enums';
import type { TriplitClient } from '@triplit/client';

export enum NotificationType {
	ANNOUNCEMENT = 'announcement',
	FILES = 'files',
	ATTENDEES = 'attendees'
}

const scheduler = new ToadScheduler();
let isProcessing = false;

// Define TypeScript type for NotificationQueue entry
interface NotificationQueueEntry {
	id: string;
	user_id: string;
	object_type: NotificationType;
	object_ids: string; // Comma-separated list of IDs
	event_id: string; // Event ID to validate associations
	sent_at: Date | null;
}

async function processNotification(notification: NotificationQueueEntry) {
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

	const attendingUsers = await getAttendeeUserIdsOfEvent(serverTriplitClient as TriplitClient, eventId, [
		Status.GOING,
		Status.MAYBE
	]);

	if (!attendingUsers.length) return;

	const message = `You have ${announcementIds.length} new announcements in an event you're attending!`;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendee of attendingUsers) {
			await tx.insert('notifications', {
				event_id: eventId,
				user_id: attendee.user_id,
				message,
				object_type: NotificationType.ANNOUNCEMENT,
				object_ids: announcementIds.join(',')
			});
		}
	});

	console.log(`Created notifications for ${attendingUsers.length} attendees.`);
}

async function notifyAttendeesOfFiles(eventId: string, fileIds: string[]): Promise<void> {
	if (!fileIds.length) return;

	const attendingUsers = await getAttendeeUserIdsOfEvent(serverTriplitClient as TriplitClient, eventId, [
		Status.GOING,
		Status.MAYBE
	]);

	if (!attendingUsers.length) return;

	const message = `You have ${fileIds.length} new files in an event you're attending!`;

	await serverTriplitClient.transact(async (tx) => {
		for (const attendee of attendingUsers) {
			await tx.insert('notifications', {
				event_id: eventId,
				user_id: attendee.user_id,
				message,
				object_type: NotificationType.FILES,
				object_ids: fileIds.join(',')
			});
		}
	});

	console.log(`Created notifications for ${attendingUsers.length} attendees.`);
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

const notificationTask = new Task('Process Notifications Queue', async () => {
	if (isProcessing) {
		console.log('Task is already running, skipping this cycle.');
		return;
	}

	isProcessing = true; // Set flag to indicate the task is running
	console.log('Starting notification processing task...');

	try {
		const query = serverTriplitClient
			.query('notifications_queue')
			.select(['id', 'object_type', 'object_type'])
			.where([
				['sent_at', '=', null] // Only fetch unsent notifications
			])
			.build();
		// .limit(100); // Limit to 100 notifications per fetch

		// Fetch the notifications
		const notifications = await serverTriplitClient.fetch(query);
		// Process each notification
		for (const notification of notifications) {
			await processNotification(notification); // Custom logic for handling notifications
		}

		console.log('Notification processing complete.');
	} catch (error) {
		console.error('Error while processing notifications:', error);
	} finally {
		isProcessing = false; // Reset the flag
	}
});

// Schedule the task
const notificationJob = new SimpleIntervalJob({ seconds: 10 }, notificationTask);

scheduler.addSimpleIntervalJob(notificationJob);

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('Stopping scheduler...');
	scheduler.stop();
});
process.on('SIGINT', () => {
	console.log('Stopping scheduler...');
	scheduler.stop();
});

module.exports = scheduler;
