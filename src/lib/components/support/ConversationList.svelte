<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { getAllSupportConversations } from '$lib/support';
	import ConversationPreview from './ConversationPreview.svelte';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw } from 'lucide-svelte';

	let { 
		selectedConversationId = null,
		onConversationSelect 
	} = $props<{
		selectedConversationId?: string | null;
		onConversationSelect: (conversation: any) => void;
	}>();

	let conversations = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	let statusFilter = $state('all');

	// Real-time subscription
	let unsubscribe: (() => void) | null = null;

	const loadConversations = async () => {
		try {
			isLoading = true;
			error = '';

			const client = getFeWorkerTriplitClient($page.data.jwt);
			
			// Set up real-time subscription with simplified query
			unsubscribe = client.subscribe(
				client
					.query('support_conversations')
					.Include('user')
					.Order('updated_at', 'DESC'),
				(results) => {
					conversations = results.filter(conv => 
						statusFilter === 'all' || conv.status === statusFilter
					);
					isLoading = false;
				}
			);
		} catch (err) {
			console.error('Error loading support conversations:', err);
			error = 'Failed to load conversations';
			isLoading = false;
		}
	};

	const refreshConversations = () => {
		if (unsubscribe) {
			unsubscribe();
		}
		loadConversations();
	};

	// Filter conversations when status filter changes
	let previousStatusFilter = $state('all');
	$effect(() => {
		if (statusFilter !== previousStatusFilter) {
			previousStatusFilter = statusFilter;
			if (!isLoading) {
				refreshConversations();
			}
		}
	});

	onMount(() => {
		loadConversations();
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
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
				Support Conversations
			</h2>
			<Button
				variant="ghost"
				size="sm"
				onclick={refreshConversations}
				disabled={isLoading}
			>
				<RefreshCw class={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
			</Button>
		</div>

		<!-- Status Filter -->
		<div class="mt-3 flex gap-2">
			<Button
				variant={statusFilter === 'all' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => statusFilter = 'all'}
			>
				All
			</Button>
			<Button
				variant={statusFilter === 'open' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => statusFilter = 'open'}
			>
				Open
			</Button>
			<Button
				variant={statusFilter === 'closed' ? 'default' : 'ghost'}
				size="sm"
				onclick={() => statusFilter = 'closed'}
			>
				Closed
			</Button>
		</div>
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
				<p class="text-gray-600 dark:text-gray-400">Loading conversations...</p>
			</div>
		</div>
	{:else if conversations.length === 0}
		<!-- Empty State -->
		<div class="flex flex-1 items-center justify-center p-8">
			<div class="text-center">
				<p class="text-gray-600 dark:text-gray-400 mb-2">
					No {statusFilter === 'all' ? '' : statusFilter} conversations found
				</p>
				<p class="text-sm text-gray-500 dark:text-gray-500">
					Support conversations will appear here when users contact support.
				</p>
			</div>
		</div>
	{:else}
		<!-- Conversations List -->
		<div class="flex-1 overflow-y-auto">
			{#each conversations as conversation (conversation.id)}
				<ConversationPreview 
					{conversation}
					isSelected={selectedConversationId === conversation.id}
					onClick={() => onConversationSelect(conversation)}
				/>
			{/each}
		</div>
	{/if}
</div>