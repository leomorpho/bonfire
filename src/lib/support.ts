import { and, HttpClient, TriplitClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Get or create a support conversation for a user.
 * Each user has one ongoing conversation at a time.
 * 
 * @param {WorkerClient | HttpClient} client - The Triplit client instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} - The conversation object.
 */
export async function getOrCreateSupportConversation(
	client: WorkerClient | HttpClient | TriplitClient,
	userId: string
): Promise<object> {
	console.log('getOrCreateSupportConversation called with userId:', userId);
	
	try {
		// First, try to find an existing open conversation
		console.log('Searching for existing conversation...');
		const existingConversation = await client.fetchOne(
			client.query('support_conversations').Where([
				and([
					['user_id', '=', userId],
					['status', '=', 'open']
				])
			])
		);

		if (existingConversation) {
			console.log('Found existing conversation:', existingConversation);
			return existingConversation;
		}

		// Create a new conversation if none exists
		console.log('Creating new conversation...');
		const newConversation = await client.insert('support_conversations', {
			user_id: userId,
			status: 'open',
			created_at: new Date(),
			updated_at: new Date()
		});

		console.log('Created new conversation:', newConversation);
		
		// Fetch the conversation again to ensure it exists and get the correct format
		const createdConversation = await client.fetchOne(
			client.query('support_conversations').Where([['id', '=', newConversation.id]])
		);
		
		if (!createdConversation) {
			throw new Error('Failed to create conversation');
		}
		
		console.log('Fetched created conversation:', createdConversation);
		return createdConversation;
	} catch (err) {
		console.error('Error in getOrCreateSupportConversation:', err);
		throw err;
	}
}

/**
 * Send a support message.
 * 
 * @param {WorkerClient | HttpClient} client - The Triplit client instance.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the sender.
 * @param {string} content - The message content.
 * @param {boolean} isAdminMessage - Whether this is from an admin.
 * @returns {Promise<object>} - The newly created message object.
 */
export async function sendSupportMessage(
	client: WorkerClient | HttpClient | TriplitClient,
	conversationId: string,
	userId: string,
	content: string,
	isAdminMessage: boolean = false
): Promise<object> {
	console.log('sendSupportMessage called with:', { conversationId, userId, content, isAdminMessage });
	
	try {
		console.log('Inserting message...');
		const message = await client.insert('support_messages', {
			conversation_id: conversationId,
			user_id: userId,
			content,
			is_admin_message: isAdminMessage,
			created_at: new Date()
		});
		console.log('Message inserted:', message);

		// Update conversation's last_message_at timestamp
		// Note: Temporarily disabled to avoid EntityNotFoundError
		// console.log('Updating conversation timestamp...');
		// try {
		// 	await client.update('support_conversations', conversationId, (conversation) => {
		// 		conversation.last_message_at = new Date();
		// 		conversation.updated_at = new Date();
		// 	});
		// 	console.log('Conversation updated');
		// } catch (updateError) {
		// 	console.warn('Failed to update conversation timestamp:', updateError);
		// 	// Don't fail the whole operation if timestamp update fails
		// }

		return message;
	} catch (err) {
		console.error('Error in sendSupportMessage:', err);
		throw err;
	}
}

/**
 * Get messages for a support conversation.
 * 
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} conversationId - The ID of the conversation.
 * @param {number} limit - Maximum number of messages to fetch.
 * @param {string | null} before - Fetch messages before this timestamp (for pagination).
 * @returns {Promise<object[]>} - List of messages with user information.
 */
export async function getSupportMessages(
	client: WorkerClient,
	conversationId: string,
	limit: number = 50,
	before: string | null = null
): Promise<object[]> {
	let query = client
		.query('support_messages')
		.Where([['conversation_id', '=', conversationId]])
		.Include('user')
		.Include('seen_by')
		.Order('created_at', 'DESC')
		.Limit(limit);

	if (before) {
		query = query.Where([['created_at', '<', new Date(before)]]);
	}

	const messages = await client.fetch(query);
	
	// Return messages in chronological order (oldest first)
	return messages.reverse();
}

/**
 * Mark a support message as seen.
 * 
 * @param {WorkerClient | HttpClient} client - The Triplit client instance.
 * @param {string} messageId - The ID of the message.
 * @param {string} userId - The ID of the user marking the message as seen.
 * @returns {Promise<void>}
 */
export async function markSupportMessageAsSeen(
	client: WorkerClient | HttpClient | TriplitClient,
	messageId: string,
	userId: string
): Promise<void> {
	// Check if the user has already marked this message as seen
	const existingSeen = await client.fetchOne(
		client.query('support_message_seen').Where([
			and([
				['message_id', '=', messageId],
				['user_id', '=', userId]
			])
		])
	);

	// If not already marked as seen, insert a new seen record
	if (!existingSeen) {
		await client.insert('support_message_seen', {
			message_id: messageId,
			user_id: userId,
			seen_at: new Date()
		});
	}
}

/**
 * Close a support conversation.
 * 
 * @param {WorkerClient | HttpClient} client - The Triplit client instance.
 * @param {string} conversationId - The ID of the conversation.
 * @returns {Promise<object>} - The updated conversation object.
 */
export async function closeSupportConversation(
	client: WorkerClient | HttpClient | TriplitClient,
	conversationId: string
): Promise<object> {
	const updatedConversation = await client.update('support_conversations', conversationId, (conversation) => {
		conversation.status = 'closed';
		conversation.updated_at = new Date();
	});

	return updatedConversation;
}

/**
 * Reopen a support conversation.
 * 
 * @param {WorkerClient | HttpClient} client - The Triplit client instance.
 * @param {string} conversationId - The ID of the conversation.
 * @returns {Promise<object>} - The updated conversation object.
 */
export async function reopenSupportConversation(
	client: WorkerClient | HttpClient | TriplitClient,
	conversationId: string
): Promise<object> {
	const updatedConversation = await client.update('support_conversations', conversationId, (conversation) => {
		conversation.status = 'open';
		conversation.updated_at = new Date();
	});

	return updatedConversation;
}

/**
 * Get all support conversations (admin function).
 * 
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} status - Filter by conversation status ('open', 'closed', or 'all').
 * @param {number} limit - Maximum number of conversations to fetch.
 * @returns {Promise<object[]>} - List of conversations with user information and message counts.
 */
export async function getAllSupportConversations(
	client: WorkerClient,
	status: 'open' | 'closed' | 'all' = 'all',
	limit: number = 100
): Promise<object[]> {
	let query = client
		.query('support_conversations')
		.Include('user')
		.Include('messages')
		.Order('last_message_at', 'DESC')
		.Limit(limit);

	if (status !== 'all') {
		query = query.Where([['status', '=', status]]);
	}

	const conversations = await client.fetch(query);
	return conversations;
}

/**
 * Get unread message count for a support conversation.
 * 
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<number>} - Number of unread messages.
 */
export async function getUnreadSupportMessageCount(
	client: WorkerClient,
	conversationId: string,
	userId: string
): Promise<number> {
	// Get all messages in the conversation
	const allMessages = await client.fetch(
		client
			.query('support_messages')
			.Where([['conversation_id', '=', conversationId]])
			.Select(['id'])
	);

	// Get messages this user has seen
	const seenMessages = await client.fetch(
		client
			.query('support_message_seen')
			.Where([['user_id', '=', userId]])
			.Select(['message_id'])
	);

	const seenMessageIds = new Set(seenMessages.map(seen => seen.message_id));
	const unreadCount = allMessages.filter(msg => !seenMessageIds.has(msg.id)).length;

	return unreadCount;
}