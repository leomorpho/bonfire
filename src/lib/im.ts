import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Send a new message in an event chat.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the sender.
 * @param {string} content - The text content of the message.
 * @param {string | null} mediaKey - Optional media file key.
 * @param {string | null} mediaType - Type of media (image, video, etc.).
 * @param {string | null} parentMessageId - ID of parent message (for threading, future-proof).
 * @returns {Promise<object>} - The newly created message object.
 */
export async function sendMessage(
	client: WorkerClient,
	eventId: string,
	userId: string,
	content: string,
	mediaKey: string | null = null,
	mediaType: string | null = null,
	parentMessageId: string | null = null
): Promise<object> {
	const message = await client.insert('event_messages', {
		event_id: eventId,
		user_id: userId,
		content,
		media_key: mediaKey,
		media_type: mediaType,
		parent_message_id: parentMessageId
	});

	return message;
}

/**
 * Edit a message.
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
 * Fetch messages for an event, including seen status for the current user.
 * @param {string} eventId - The ID of the event.
 * @param {string} userId - The ID of the current user.
 * @returns {Promise<object[]>} - List of messages with seen status for the user.
 */
export async function getMessages(client: WorkerClient, eventId: string): Promise<object[]> {
	const messages = await client.fetch(
		client
			.query('event_messages')
			.where([['event_id', '=', eventId]])
			.include('event_message_seen')
			.build()
	);

	return messages;
}

/**
 * Mark a message as seen.
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
