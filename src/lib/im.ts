import { and, HttpClient, TriplitClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';
import { createNewMessageNotificationQueueObject } from './notification_queue';

export const MAIN_THREAD = 'main';

/**
 * Fetch a thread by its ID, or by event ID and name.
 * Either `threadId` or (`eventId` and `name`) is required.
 *
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string | null} threadId - The ID of the thread (optional).
 * @param {string | null} eventId - The ID of the event (optional, required if threadId is not provided).
 * @param {string | null} name - The name of the thread (optional, required if threadId is not provided).
 * @returns {Promise<object | null>} - The thread object if found, otherwise null.
 * @throws {Error} - If neither `threadId` nor `eventId` + `name` are provided.
 */
export async function getThread(
	client: WorkerClient,
	threadId: string | null = null,
	eventId: string | null = null,
	name: string | null = null
): Promise<object | null> {
	// Ensure at least one valid identifier is provided
	if (!threadId && (!eventId || !name)) {
		throw new Error('Either threadId or both eventId and name must be provided');
	}

	// Build query dynamically
	let query = client.query('event_threads');

	if (threadId) {
		query = query.Where([['id', '=', threadId]]);
	} else if (eventId && name) {
		query = query.Where([
			and([
				['event_id', '=', eventId],
				['name', '=', name]
			])
		]);
	}

	const thread = await client.fetchOne(query);

	return thread || null; // Return null if no thread is found
}

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
	client: WorkerClient | TriplitClient | HttpClient,
	eventId: string,
	userId: string,
	name: string
): Promise<object> {
	const output = await client.insert('event_threads', {
		id: `${eventId}-${name}`,
		event_id: eventId,
		user_id: userId,
		name
	});

	return output;
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
	client: WorkerClient | HttpClient,
	eventId: string,
	threadId: string,
	userId: string,
	content: string,
	parentMessageId: string | null = null
) {
	const output = await client.insert('event_messages', {
		thread_id: threadId,
		user_id: userId,
		content,
		parent_message_id: parentMessageId,
		created_at: new Date().toISOString()
	});

	// Create notifications_queue entry
	await createNewMessageNotificationQueueObject(client, userId, eventId, [output.id]);
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
		client.query('event_messages').Where([['id', '=', messageId]])
	);

	if (!message) {
		throw new Error('Message not found');
	}

	// Only allow message deletion if the user is the sender or an event admin
	const isAuthorized =
		message.user_id === userId ||
		(await client.fetchOne(
			client.query('event_admins').Where([
				['event_id', '=', message.event_id],
				['user_id', '=', userId]
			])
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
			.Where([['thread_id', '=', threadId]])
			.Include('event_message_seen')
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
		client.query('event_message_seen').Where([
			and([
				['message_id', '=', messageId],
				['user_id', '=', userId]
			])
		])
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
		client.query('event_message_seen').Where([
			and([
				['message_id', '=', messageId],
				['user_id', '=', userId]
			])
		])
	);

	return seenRecord ? seenRecord.seen_at : null;
}
