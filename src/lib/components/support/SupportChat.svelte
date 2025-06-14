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

	let { 
		isAdmin = false, 
		conversationId = null 
	} = $props<{
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

	const scrollToBottom = () => {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	};

	const loadConversation = async () => {
		try {
			isLoading = true;
			error = '';

			console.log('Loading conversation...');
			
			const client = getFeWorkerTriplitClient($page.data.jwt);
			console.log('Got Triplit client:', client);
			
			userId = (await waitForUserId()) as string;
			console.log('Got user ID:', userId);

			if (!userId) {
				throw new Error('User not authenticated');
			}

			if (isAdmin && conversationId) {
				// Admin view: load specific conversation
				console.log('Loading admin conversation:', conversationId);
				conversation = await client.fetchOne(
					client.query('support_conversations').Where([['id', '=', conversationId]])
				);
				if (!conversation) {
					throw new Error('Conversation not found');
				}
			} else {
				// User view: get or create conversation
				console.log('Getting or creating user conversation...');
				conversation = await getOrCreateSupportConversation(client, userId);
				console.log('Got conversation:', conversation);
			}

			// Load messages
			console.log('Loading messages for conversation:', conversation.id);
			const loadedMessages = await getSupportMessages(client, conversation.id);
			console.log('Loaded messages:', loadedMessages);
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
			// Scroll to bottom after initial load
			requestAnimationFrame(scrollToBottom);
		} catch (err) {
			console.error('Error loading support conversation:', err);
			error = 'Failed to load conversation';
			isLoading = false;
		}
	};

	const handleSendMessage = async (content: string) => {
		if (!conversation || !userId) return;

		try {
			console.log('Sending message:', { conversationId: conversation.id, userId, content, isAdmin });
			const client = getFeWorkerTriplitClient($page.data.jwt);
			await sendSupportMessage(client, conversation.id, userId, content, isAdmin);
			console.log('Message sent successfully');
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

	onMount(() => {
		loadConversation();
	});

	// Reload conversation when conversationId changes (admin view)
	$effect(() => {
		if (isAdmin && conversationId) {
			if (unsubscribe) {
				unsubscribe();
			}
			loadConversation();
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
			{isAdmin 
				? 'Helping users with their questions and issues'
				: 'Get help from our support team'
			}
		</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border-l-4 border-red-400 p-4 dark:bg-red-900/20">
			<div class="text-sm text-red-700 dark:text-red-400">{error}</div>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
				<p class="text-gray-600 dark:text-gray-400">Loading conversation...</p>
			</div>
		</div>
	{:else}
		<!-- Messages Container -->
		<div 
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto p-4 space-y-2"
		>
			{#if messages.length === 0}
				<div class="flex flex-1 items-center justify-center text-center py-8">
					<div>
						<p class="text-gray-600 dark:text-gray-400 mb-2">
							{isAdmin 
								? 'No messages yet in this conversation.'
								: 'Start a conversation with our support team!'
							}
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-500">
							{isAdmin 
								? 'Wait for the user to send a message.'
								: 'Ask any questions or report issues below.'
							}
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
			placeholder={isAdmin 
				? 'Type your response...'
				: 'Describe your issue or question...'
			}
		/>
	{/if}
</div>