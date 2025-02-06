<script lang="ts">
	import { page } from '$app/stores';
	import { MAIN_THREAD } from '$lib/im';
	import { getFeTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';
	import ImInput from './ImInput.svelte';

	let { threadId = null } = $props();

	let messages: any = $state();
	let loadMoreMessages: ((pageSize?: number) => void) | undefined = $state();

	onMount(() => {
		const client = getFeTriplitClient($page.data.jwt);

		let threadMessagesQuery = client.query('event_messages');

		if (threadId) {
			threadMessagesQuery = threadMessagesQuery.where([['thread_id', '=', threadId]]);
		} else {
			threadMessagesQuery = threadMessagesQuery.where([['thread.name', '=', MAIN_THREAD]]);
		}

		threadMessagesQuery = threadMessagesQuery.order('created_at', 'DESC').build();

		const { unsubscribe: unsubscribeFromMessages, loadMore } = client.subscribeWithExpand(
			threadMessagesQuery,
			(results, info) => {
				// Avoid duplicates by checking IDs
				const existingIds = new Set(messages.map((m: any) => m.id));
				const uniqueResults = results.filter((m: any) => !existingIds.has(m.id));

				// Update with unique messages only and sort by created_at
				messages = [...messages, ...uniqueResults].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				) as [];

				loadMoreMessages = loadMore; // Save the loadMore function for pagination
			},
			(error) => {
				// handle error
				console.error('Error fetching messages:', error);
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log('server has sent back results for the subscription');
				}
			}
		);

		// Ensure cleanup on component destruction
		return () => {
			unsubscribeFromMessages();
		};
	});
</script>

<div class="flex flex-col h-40 rounded-xl bg-white bg-opacity-50 dark:bg-slate-700 dark:bg-opacity-50">
	{#if messages && messages.length > 0}{:else}
		<div class="flex h-full w-full items-center justify-center">No messages yet</div>
		<ImInput />
	{/if}
</div>
