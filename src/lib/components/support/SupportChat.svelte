<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import {
		getOrCreateSupportConversation,
		sendSupportMessage,
		getSupportMessages,
		markSupportMessageAsSeen
	} from '$lib/support';
	import SupportMessage from './SupportMessage.svelte';
	import SupportInput from './SupportInput.svelte';

	let { isAdmin = false, conversationId = null } = $props<{
		isAdmin?: boolean;
		conversationId?: string | null;
	}>();

	let userId = $state('');
	let conversation = $state(null);
	let messages = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	let messagesContainer: HTMLElement;

	// Real-time subscription
	let unsubscribe: (() => void) | null = null;
	let isSubscribing = $state(false);

	const scrollToBottom = () => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	};

	const loadConversation = async () => {
		if (isSubscribing) {
			console.log('Already subscribing, skipping...');
			return;
		}

		try {
			isLoading = true;
			isSubscribing = true;
			error = '';

			const client = getFeWorkerTriplitClient($page.data.jwt);

			userId = (await waitForUserId()) as string;

			if (!userId) {
				if ($page.data.user?.id) {
					userId = $page.data.user.id;
				} else {
					throw new Error('User not authenticated');
				}
			}

			if (isAdmin && conversationId) {
				// Admin view: load specific conversation
				conversation = await client.fetchOne(
					client.query('support_conversations').Where([['id', '=', conversationId]])
				);
				if (!conversation) {
					throw new Error('Conversation not found');
				}
			} else {
				// User view: get or create conversation
				conversation = await getOrCreateSupportConversation(client, userId);
			}

			// Load messages
			const loadedMessages = await getSupportMessages(client, conversation.id);
			messages = loadedMessages;

			// Set up real-time subscription for new messages
			unsubscribe = client.subscribe(
				client
					.query('support_messages')
					.Where([['conversation_id', '=', conversation.id]])
					.Include('user')
					.Include('seen_by')
					.Order('created_at', 'ASC'),
				(results) => {
					messages = results;
					// Auto-scroll to bottom when new messages arrive
					requestAnimationFrame(scrollToBottom);
				}
			);

			isLoading = false;
			isSubscribing = false;
			// Scroll to bottom after initial load
			requestAnimationFrame(scrollToBottom);
		} catch (err) {
			console.error('Error loading support conversation:', err);
			error = 'Failed to load conversation';
			isLoading = false;
			isSubscribing = false;
		}
	};

	const handleSendMessage = async (content: string) => {
		if (!conversation || !userId) return;

		try {
			const client = getFeWorkerTriplitClient($page.data.jwt);

			// Verify conversation exists before sending message
			const existingConversation = await client.fetchOne(
				client.query('support_conversations').Where([['id', '=', conversation.id]])
			);

			if (!existingConversation) {
				await loadConversation();
				return;
			}

			await sendSupportMessage(client, conversation.id, userId, content, isAdmin);
		} catch (err) {
			console.error('Error sending support message:', err);
			error = 'Failed to send message';
		}
	};

	const handleMessageSeen = async (messageId: string) => {
		if (!userId) return;

		try {
			const client = getFeWorkerTriplitClient($page.data.jwt);
			await markSupportMessageAsSeen(client, messageId, userId);
		} catch (err) {
			console.error('Error marking message as seen:', err);
		}
	};

	// Track previous conversationId to prevent unnecessary reloads
	let previousConversationId = $state(undefined);

	// Single effect to handle all loading scenarios
	$effect(() => {
		// Wait a tick to ensure props are stable
		setTimeout(() => {
			// Only load if:
			// 1. We're not already loading/subscribing
			// 2. ConversationId has actually changed (for admin) or it's the initial load
			if (isSubscribing) return;

			const shouldLoad =
				!isAdmin || (isAdmin && conversationId && conversationId !== previousConversationId);

			if (shouldLoad) {
				previousConversationId = conversationId;

				if (unsubscribe) {
					unsubscribe();
					unsubscribe = null;
				}

				loadConversation();
			}
		}, 0);
	});

	// Simple error recovery without automatic retry to prevent loops
	$effect(() => {
		if (error) {
			// Don't auto-retry to prevent loops
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div class="flex h-full flex-col bg-white dark:bg-gray-800">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
		<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
			{isAdmin ? 'Support Chat' : 'Contact Support'}
		</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			{isAdmin ? 'Helping users with their questions and issues' : 'Get help from our support team'}
		</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="border-l-4 border-red-400 bg-red-50 p-4 dark:bg-red-900/20">
			<div class="text-sm text-red-700 dark:text-red-400">{error}</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"
				></div>
				<p class="text-gray-600 dark:text-gray-400">Loading conversation...</p>
			</div>
		</div>
	{:else}
		<!-- Messages Container -->
		<div bind:this={messagesContainer} class="flex-1 space-y-2 overflow-y-auto p-4">
			{#if messages.length === 0}
				<div class="flex flex-1 items-center justify-center py-8 text-center">
					<div>
						<p class="mb-2 text-gray-600 dark:text-gray-400">
							{isAdmin
								? 'No messages yet in this conversation.'
								: 'Start a conversation with our support team!'}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-500">
							{isAdmin
								? 'Wait for the user to send a message.'
								: 'Ask any questions or report issues below.'}
						</p>
					</div>
				</div>
			{:else}
				{#each messages as message (message.id)}
					<SupportMessage
						{message}
						currUserId={userId}
						onMessageSeen={() => handleMessageSeen(message.id)}
					/>
				{/each}
			{/if}
		</div>

		<!-- Input Area -->
		<SupportInput
			{handleSendMessage}
			disabled={isLoading}
			placeholder={isAdmin ? 'Type your response...' : 'Describe your issue or question...'}
		/>
	{/if}
</div>
