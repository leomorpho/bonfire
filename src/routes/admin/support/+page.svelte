<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { waitForUserId } from '$lib/triplit';
	import ConversationList from '$lib/components/support/ConversationList.svelte';
	import SupportChat from '$lib/components/support/SupportChat.svelte';
	import { Button } from '$lib/components/ui/button';
	import { closeSupportConversation, reopenSupportConversation } from '$lib/support';
	import { getFeWorkerTriplitClient } from '$lib/triplit';

	let selectedConversation = $state(null);
	let userId = $state('');
	let isAdmin = $state(false);

	// For now, we'll assume any logged-in user can access admin support
	// In a real app, you'd check admin permissions here
	const checkAdminAccess = async () => {
		try {
			userId = (await waitForUserId()) as string;
			// TODO: Add proper admin check here
			// For now, allow all users to access admin support
			isAdmin = true;
		} catch (err) {
			console.error('Error checking admin access:', err);
			isAdmin = false;
		}
	};

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

	onMount(() => {
		checkAdminAccess();
	});
</script>

<svelte:head>
	<title>Support Admin - Bonfire</title>
	<meta name="description" content="Manage support conversations" />
</svelte:head>

{#if !isAdmin}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
				Access Denied
			</h1>
			<p class="text-gray-600 dark:text-gray-400">
				You don't have permission to access the support admin dashboard.
			</p>
		</div>
	</div>
{:else}
	<div class="fixed inset-0 flex">
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
{/if}