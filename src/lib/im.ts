import type { WorkerClient } from '@triplit/client/worker-client';

export const MAIN_THREAD = 'main';

/**
 * Create a new thread within an event.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the user creating the thread.
 * @param {string} name - The name of the thread.
 * @param {string | null} parentMessageId - Optional: If creating a thread from a message.
 * @returns {Promise<object>} - The newly created thread object.
 */
export async function createNewThread(
	client: WorkerClient,
	eventId: string,
	userId: string,
	name: string
): Promise<object> {
	const thread = await client.insert('event_threads', {
		event_id: eventId,
		user_id: userId,
		name
	});

	return thread;
}

/**
 * Send a new message in an event thread.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} threadId - The ID of the thread to send the message in.
 * @param {string} userId - The ID of the sender.
 * @param {string} content - The text content of the message.
 * @param {string | null} mediaKey - Optional media file key.
 * @param {string | null} mediaType - Type of media (image, video, etc.).
 * @param {string | null} parentMessageId - Optional: If this is a reply.
 * @returns {Promise<object>} - The newly created message object.
 */
export async function sendMessage(
	client: WorkerClient,
	threadId: string,
	userId: string,
	content: string,
	mediaKey: string | null = null,
	mediaType: string | null = null,
	parentMessageId: string | null = null
): Promise<object> {
	const message = await client.insert('event_messages', {
		thread_id: threadId,
		user_id: userId,
		content,
		media_key: mediaKey,
		media_type: mediaType,
		parent_message_id: parentMessageId,
		created_at: new Date().toISOString()
	});

	return message;
}

/**
 * Edit a message.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} messageId - The ID of the message to edit.
 * @param {string} userId - The ID of the user editing the message.
 * @param {string} newContent - The updated message content.
 * @returns {Promise<object>} - The updated message object.
 */
export async function editMessage(
	client: WorkerClient,
	messageId: string,
	userId: string,
	newContent: string
): Promise<object> {
	const updatedMessage = await client.update('event_messages', messageId, (msg) => {
		if (msg.user_id !== userId) {
			throw new Error('Unauthorized: You can only edit your own messages');
		}
		msg.content = newContent;
		msg.updated_at = new Date().toISOString();
	});

	return updatedMessage;
}

/**
 * Delete a message.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} messageId - The ID of the message to delete.
 * @param {string} userId - The ID of the user requesting deletion.
 * @returns {Promise<void>}
 */
export async function deleteMessage(
	client: WorkerClient,
	messageId: string,
	userId: string
): Promise<void> {
	const message = await client.fetchOne(
		client
			.query('event_messages')
			.where([['id', '=', messageId]])
			.build()
	);

	if (!message) {
		throw new Error('Message not found');
	}

	// Only allow message deletion if the user is the sender or an event admin
	const isAuthorized =
		message.user_id === userId ||
		(await client.fetchOne(
			client
				.query('event_admins')
				.where([
					['event_id', '=', message.event_id],
					['user_id', '=', userId]
				])
				.build()
		));

	if (!isAuthorized) {
		throw new Error('Unauthorized: You can only delete your own messages or if you are an admin');
	}

	await client.delete('event_messages', messageId);
}

/**
 * Fetch messages for a thread, including seen status for the current user.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} threadId - The ID of the thread.
 * @returns {Promise<object[]>} - List of messages with seen status.
 */
export async function getMessages(client: WorkerClient, threadId: string): Promise<object[]> {
	const messages = await client.fetch(
		client
			.query('event_messages')
			.where([['thread_id', '=', threadId]])
			.include('event_message_seen')
			.build()
	);

	return messages;
}

/**
 * Mark a message as seen.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} messageId - The ID of the message.
 * @param {string} userId - The ID of the user marking the message as seen.
 * @returns {Promise<void>}
 */
export async function markMessageAsSeen(
	client: WorkerClient,
	messageId: string,
	userId: string
): Promise<void> {
	// Check if the user has already marked this message as seen
	const existingSeen = await client.fetchOne(
		client
			.query('event_message_seen')
			.where([
				['message_id', '=', messageId],
				['user_id', '=', userId]
			])
			.build()
	);

	// If not already marked as seen, insert a new seen record
	if (!existingSeen) {
		await client.insert('event_message_seen', {
			message_id: messageId,
			user_id: userId,
			seen_at: new Date().toISOString()
		});
	}
}

/**
 * Get the seen status of a message for the current user.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} messageId - The ID of the message.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<string | null>} - Timestamp if seen, null otherwise.
 */
export async function getMessageSeenStatus(
	client: WorkerClient,
	messageId: string,
	userId: string
): Promise<string | null> {
	const seenRecord = await client.fetchOne(
		client
			.query('event_message_seen')
			.where([
				['message_id', '=', messageId],
				['user_id', '=', userId]
			])
			.build()
	);

	return seenRecord ? seenRecord.seen_at : null;
}
