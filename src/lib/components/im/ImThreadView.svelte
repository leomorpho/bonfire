<script lang="ts">
	import { page } from '$app/stores';
	import { createNewThread, getThread, MAIN_THREAD, sendMessage } from '$lib/im';
	import { getFeTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';
	import ImInput from './ImInput.svelte';
	import type { WorkerClient } from '@triplit/client/worker-client';
	import Message from './Message.svelte';

	let { eventId, currUserId, profileImageMap, threadId = null, canSendIm = true } = $props();

	$effect(() => {
		console.log('AAABC profileImageMap', profileImageMap);
	});
	let messages: any = $state([]);
	let loadMoreMessages: ((pageSize?: number) => void) | undefined = $state();

	onMount(() => {
		const client = getFeTriplitClient($page.data.jwt);

		let threadMessagesQuery = client.query('event_messages');

		if (threadId) {
			threadMessagesQuery = threadMessagesQuery.where([['thread_id', '=', threadId]]);
		} else {
			threadMessagesQuery = threadMessagesQuery.where([['thread.name', '=', MAIN_THREAD]]);
		}

		threadMessagesQuery = threadMessagesQuery.include('user').order('created_at', 'DESC').build();

		const { unsubscribe: unsubscribeFromMessages, loadMore } = client.subscribeWithExpand(
			threadMessagesQuery,
			(results, info) => {
				// Avoid duplicates by checking IDs
				const existingIds = new Set(messages.map((m: any) => m.id));
				const uniqueResults = results.filter((m: any) => !existingIds.has(m.id));

				// // Update with unique messages only and sort by created_at
				messages = [...messages, ...uniqueResults].sort(
					(a, b) => new Date(a.created_at) - new Date(b.created_at)
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

	const getOrCreateThread = async (client: WorkerClient, eventId: string, threadName: string) => {
		let thread = await getThread(client, null, eventId, threadName);

		if (thread) {
			return thread.id;
		}

		thread = await createNewThread(client, eventId, $page.data.user.id, MAIN_THREAD);
		return thread.id;
	};

	const handleSendMessage = async (message: string) => {
		const client = getFeTriplitClient($page.data.jwt);

		try {
			if (!threadId) {
				threadId = await getOrCreateThread(client, eventId, MAIN_THREAD);
			}
			console.log('Creating message for thread', threadId);
			if (!threadId) {
				return;
			}
			await sendMessage(client, threadId, $page.data.user.id, message);
		} catch (e) {
			console.error(`failed to send message for threadId ${threadId}`, e);
		}
	};
</script>

<div class="flex flex-col rounded-xl bg-white bg-opacity-50 dark:bg-slate-700 dark:bg-opacity-50">
	{#if messages && messages.length > 0}
		<div class="h-full w-full space-y-2">
			{#each messages as message}
				<Message
					url={profileImageMap.get(message.user_id)?.small_image_url}
					{currUserId}
					{message}
				/>
			{/each}
		</div>
	{:else}
		<div class="flex h-full w-full items-center justify-center">No messages yet</div>
	{/if}
	{#if canSendIm}
		<ImInput {handleSendMessage} />
	{/if}
</div>
