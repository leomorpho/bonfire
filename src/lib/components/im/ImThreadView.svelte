<script lang="ts">
	import { page } from '$app/stores';
	import { createNewThread, getThread, MAIN_THREAD, sendMessage } from '$lib/im';
	import { getFeTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';
	import ImInput from './ImInput.svelte';
	import type { WorkerClient } from '@triplit/client/worker-client';
	import Message from './Message.svelte';

	let {
		eventId,
		currUserId,
		profileImageMap,
		threadId = null,
		canSendIm = true,
		maxNumMessages = null
	} = $props();

	let chatContainerRef: HTMLDivElement | null = null;
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

		if (maxNumMessages) {
			threadMessagesQuery = threadMessagesQuery.limit(maxNumMessages);
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
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				) as [];

				if (maxNumMessages) {
					messages = messages.slice(-maxNumMessages);
				}
				console.log('New messages queried!', messages);
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

<div class="flex h-full w-full flex-col">
	<div
		class="container-scroll h-full space-y-2 overflow-y-auto rounded-t-xl bg-white p-2 dark:bg-black"
	>
		<!-- <div class="skip-me hidden"> -->
		{#if messages && messages.length > 0}
			{#each messages as message}
				<Message
					url={profileImageMap.get(message.user_id)?.small_image_url}
					{currUserId}
					{message}
				/>
			{/each}
		{:else}
			<div class="flex w-full items-center justify-center">No messages yet</div>
		{/if}
	</div>
	<!-- </div> -->
	{#if canSendIm}
		<ImInput {handleSendMessage} />
	{/if}
</div>

<style>
	.container-scroll {
		/* 
		Taken from https://stackoverflow.com/a/44051405 
		Makes the scrollable content start from the bottom
		*/
		display: flex;
		flex-direction: column-reverse;
	}

	/* Initially hide scrollbar */
	.container-scroll::-webkit-scrollbar {
		width: 1px; /* Ultra-thin */
		opacity: 0; /* Hidden by default */
		transition: opacity 0.2s ease-in-out; /* Smooth fade-in */
	}

	/* Show scrollbar when scrolling */
	.container-scroll:hover::-webkit-scrollbar,
	.container-scroll:active::-webkit-scrollbar,
	.container-scroll:focus-within::-webkit-scrollbar {
		opacity: 1; /* Show scrollbar on hover, focus, or active scroll */
	}

	/* Scrollbar track */
	.container-scroll::-webkit-scrollbar-track {
		background: transparent; /* Keeps it clean */
	}

	/* Scrollbar thumb */
	.container-scroll::-webkit-scrollbar-thumb {
		background-color: rgba(100, 100, 100, 0.5);
		border-radius: 1px;
	}

	/* Firefox scrollbar: Hide by default, show on hover */
	.container-scroll {
		scrollbar-width: thin;
		scrollbar-color: transparent transparent; /* Hidden by default */
		transition: scrollbar-color 0.2s ease-in-out;
	}

	/* Show scrollbar when interacting */
	.container-scroll:hover,
	.container-scroll:active,
	.container-scroll:focus-within {
		scrollbar-color: rgba(100, 100, 100, 0.5) transparent;
	}
</style>
