import { ToadScheduler, SimpleIntervalJob, Task } from 'toad-scheduler';
import { processNotification, serverTriplitClient } from './server/triplit';

const scheduler = new ToadScheduler();
let isProcessing = false;



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

export const notificationSenderLoop = async () => {
	// Schedule the task
	const notificationJob = new SimpleIntervalJob({ seconds: 10 }, notificationTask);

	scheduler.addSimpleIntervalJob(notificationJob);

	/// Graceful shutdown
	process.on('SIGTERM', () => {
		console.log('Stopping scheduler...');
		scheduler.stop(); // Stops the scheduler
		process.exit(0); // Exit the process cleanly
	});

	process.on('SIGINT', () => {
		console.log('Stopping scheduler...');
		scheduler.stop(); // Stops the scheduler
		process.exit(0); // Exit the process cleanly
	});
};
