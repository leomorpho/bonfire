<script lang="ts">
	import { page } from '$app/stores';
	import SupportChat from '$lib/components/support/SupportChat.svelte';
	import ConversationList from '$lib/components/support/ConversationList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { closeSupportConversation, reopenSupportConversation } from '$lib/support';
	import { getFeWorkerTriplitClient } from '$lib/triplit';

	// Check if user is admin
	let isAdmin = $derived($page.data.user && $page.data.user.is_event_styles_admin);
	let selectedConversation = $state(null);

	const handleConversationSelect = (conversation: any) => {
		selectedConversation = conversation;
	};

	const handleCloseConversation = async () => {
		if (!selectedConversation) return;

		try {
			const client = getFeWorkerTriplitClient($page.data.jwt);
			await closeSupportConversation(client, selectedConversation.id);
			selectedConversation = { ...selectedConversation, status: 'closed' };
		} catch (err) {
			console.error('Error closing conversation:', err);
		}
	};

	const handleReopenConversation = async () => {
		if (!selectedConversation) return;

		try {
			const client = getFeWorkerTriplitClient($page.data.jwt);
			await reopenSupportConversation(client, selectedConversation.id);
			selectedConversation = { ...selectedConversation, status: 'open' };
		} catch (err) {
			console.error('Error reopening conversation:', err);
		}
	};
</script>

<svelte:head>
	<title>Support - Bonfire</title>
	<meta name="description" content="Get help from the Bonfire support team" />
</svelte:head>

{#if isAdmin}
	<!-- Admin view: show conversation list and chat -->
	<div class="h-[calc(100vh-4rem)] flex">
		<!-- Conversations Sidebar -->
		<div class="w-80 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
			<ConversationList 
				selectedConversationId={selectedConversation?.id}
				onConversationSelect={handleConversationSelect}
			/>
		</div>

		<!-- Main Chat Area -->
		<div class="flex-1 flex flex-col">
			{#if selectedConversation}
				<!-- Conversation Header -->
				<div class="border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
								{selectedConversation.user?.username || 'Unknown User'}
							</h2>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Status: {selectedConversation.status}
							</p>
						</div>
						
						<div class="flex gap-2">
							{#if selectedConversation.status === 'open'}
								<Button
									variant="outline"
									size="sm"
									onclick={handleCloseConversation}
								>
									Close Conversation
								</Button>
							{:else}
								<Button
									variant="outline"
									size="sm"
									onclick={handleReopenConversation}
								>
									Reopen Conversation
								</Button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Chat Component -->
				<div class="flex-1 min-h-0">
					<SupportChat 
						isAdmin={true}
						conversationId={selectedConversation.id}
					/>
				</div>
			{:else}
				<!-- No Conversation Selected -->
				<div class="flex-1 flex items-center justify-center">
					<div class="text-center">
						<h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
							Select a Conversation
						</h2>
						<p class="text-gray-600 dark:text-gray-400">
							Choose a conversation from the sidebar to start helping users.
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Regular user view: just the chat -->
	<div class="h-[calc(100vh-4rem)] flex flex-col">
		<SupportChat />
	</div>
{/if}