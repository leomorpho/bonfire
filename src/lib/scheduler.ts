import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import { triplitHttpClient } from './server/triplit';
import { unlockAllTasks } from './server/database/tasklock';
import { runNotificationProcessor } from './server/notifications/engine';
import { runReminderNotificationTask } from './server/reminders';

const scheduler = new ToadScheduler();

const notificationTask = new Task('Process Notifications Queue', async () => {
	try {
		runNotificationProcessor();

		// console.log('Notification processing complete.');
	} catch (error) {
		console.error('Error while processing notifications:', error);
	}
});

const notificationQueueCleanupTask = new Task('Cleanup Old Notifications Queue', async () => {
	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// Query to find notifications older than 30 days
		const oldNotificationsQuery = triplitHttpClient.query('notifications_queue').Where([
			['created_at', '<', thirtyDaysAgo] // Compare with the 'created_at' field
		]);
		// .Select(['id']) // Only fetch the IDs for deletion // TODO: select bug for http client
		const oldNotifications = await triplitHttpClient.fetch(oldNotificationsQuery);

		if (oldNotifications.length === 0) {
			console.log('No old notifications to delete.');
			return;
		}

		// Extract the IDs of the notifications to be deleted
		const notificationIds = oldNotifications.map((notif) => notif.id);

		for (const id of notificationIds) {
			await triplitHttpClient.delete('notifications_queue', id);
		}

		console.log(`Cleanup complete. Deleted ${notificationIds.length} old notifications.`);
	} catch (error) {
		console.error('Error during cleanup of old notifications:', error);
	}
});

const reminderNotificationsTask = new Task(
	'Notify attendees of event happening in x time',
	async () => {
		try {
			runReminderNotificationTask();

			// console.log('Notification processing complete.');
		} catch (error) {
			console.error('Error while processing notifications:', error);
		}
	}
);

export const taskRunner = async () => {
	try {
		// Schedule the task
		const notificationJob = new SimpleIntervalJob({ seconds: 3 }, notificationTask);
		const cleanupJob = new SimpleIntervalJob({ hours: 6 }, notificationQueueCleanupTask);
		const reminderNotificationsJob = new SimpleIntervalJob({ hours: 1 }, reminderNotificationsTask);

		scheduler.addSimpleIntervalJob(notificationJob);
		scheduler.addSimpleIntervalJob(cleanupJob);
		scheduler.addSimpleIntervalJob(reminderNotificationsJob);

		// Graceful shutdown handler
		const handleShutdown = async () => {
			console.log('Stopping scheduler...');
			scheduler.stop(); // Stops the scheduler
			try {
				await unlockAllTasks();
				console.log('All tasks unlocked successfully.');
			} catch (error) {
				console.error('Error unlocking tasks:', error);
			} finally {
				process.exit(0); // Exit the process cleanly
			}
		};

		// Graceful shutdown
		process.on('SIGTERM', handleShutdown);
		process.on('SIGINT', handleShutdown);
	} catch (error) {
		console.log('an error occurred starting the taskRunner', error);
	}
};
