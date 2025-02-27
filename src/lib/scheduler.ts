import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import { triplitHttpClient } from './server/triplit';
import { runNotificationProcessor } from './server/push';
import { unlockAllTasks } from './server/database/tasklock';

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
		const oldNotificationsQuery = triplitHttpClient
			.query('notifications_queue')
			.where([
				['created_at', '<', thirtyDaysAgo] // Compare with the 'created_at' field
			])
			// .select(['id']) // Only fetch the IDs for deletion // TODO: select bug for http client
			.build();

		const oldNotifications = await triplitHttpClient.fetch(oldNotificationsQuery);

		if (oldNotifications.length === 0) {
			console.log('No old notifications to delete.');
			return;
		}

		// Extract the IDs of the notifications to be deleted
		const notificationIds = oldNotifications.map((notif) => notif.id);

		// Perform deletion in a transaction
		await triplitHttpClient.transact(async (tx) => {
			for (const id of notificationIds) {
				await tx.delete('notifications_queue', id);
			}
		});

		console.log(`Cleanup complete. Deleted ${notificationIds.length} old notifications.`);
	} catch (error) {
		console.error('Error during cleanup of old notifications:', error);
	}
});

export const taskRunner = async () => {
	try {
		// Schedule the task
		const notificationJob = new SimpleIntervalJob({ seconds: 3 }, notificationTask);
		const cleanupJob = new SimpleIntervalJob({ hours: 6 }, notificationQueueCleanupTask);

		scheduler.addSimpleIntervalJob(notificationJob);
		scheduler.addSimpleIntervalJob(cleanupJob);

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
