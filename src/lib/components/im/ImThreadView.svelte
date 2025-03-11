<script lang="ts">
	import { page } from '$app/stores';
	import { createNewThread, getThread, MAIN_THREAD, sendMessage } from '$lib/im';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { onDestroy, onMount } from 'svelte';
	import ImInput from './ImInput.svelte';
	import type { WorkerClient } from '@triplit/client/worker-client';
	import Message from './Message.svelte';
	import Button from '../ui/button/button.svelte';
	import { ChevronDown } from 'lucide-svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import { and } from '@triplit/client';
	import { stringRepresentationToArray } from '$lib/utils';
	import { NotificationType } from '$lib/enums';
	import { loaderState } from './infiniteLoader/loaderState.svelte';
	import InfiniteLoader from './infiniteLoader/InfiniteLoader.svelte';
	// import { InfiniteLoader, loaderState } from 'svelte-infinite';

	let {
		eventId,
		currUserId,
		threadId = null,
		canSendIm = true,
		maxNumMessages = null,
		datetimeUserJoinedBonfire = null,
		isCurrenUserEventAdmin = false
	} = $props();

	let chatContainerRef: HTMLDivElement | null = null;
	let userScrolledUp = $state(false);
	let showMessagesLoading = $state(true);
	let initialLoad = $state(true);
	let messages: any = $state([]);
	let numUnseenMessage: number = $state(0);
	let loadMoreMessages: ((pageSize?: number) => void) | undefined = $state();
	let loadMoreMessagesCalled = $state(false);

	const maxNumMessagesLoadedPerRequest = 50;

	$effect(() => {
		console.log('loadMoreMessagesCalled', loadMoreMessagesCalled);
	});

	const handleScroll = async () => {
		if (!chatContainerRef) return;

		const offset = 0; // Set your desired offset
		const scrollTop = -chatContainerRef.scrollTop;

		// Check if the user is at the top or within the offset from the top
		const isAtTopOrWithinOffset =
			scrollTop >= chatContainerRef.scrollHeight - chatContainerRef.clientHeight - offset;

		// console.log(
		// 	'scrollTop',
		// 	scrollTop,
		// 	'chatContainerRef.scrollHeight',
		// 	chatContainerRef.scrollHeight,
		// 	'chatContainerRef.clientHeight',
		// 	chatContainerRef.clientHeight
		// );

		// If user is at the top or within the offset, we handle it here
		if (isAtTopOrWithinOffset && loadMoreMessages && !loadMoreMessagesCalled) {
			await loadMoreOlderMessages();
		}

		// Check if the user has scrolled up (not at the bottom)
		const isAtBottom = chatContainerRef.scrollTop == 0;
		userScrolledUp = !isAtBottom;
	};

	let notificationIdsNeedToBeMarkedAsSeen = $state(new Set());
	let markNotificationAsReadLockAvailable = $state(true);

	$effect(() => {
		if (markNotificationAsReadLockAvailable && notificationIdsNeedToBeMarkedAsSeen.size !== 0) {
			// Mark lock as taken
			markNotificationAsReadLockAvailable = false;
			const id = notificationIdsNeedToBeMarkedAsSeen.values().next().value;

			markNotifAsRead(id as string);
		}
	});

	const markNotifAsRead = async (id: string) => {
		console.log(`marking notification with id ${id} as seen`);
		try {
			const client = getFeWorkerTriplitClient($page.data.jwt);

			// Update the notification to mark it as seen
			await client.update('notifications', id, async (e: any) => {
				e.seen_at = new Date();
			});

			// If the update is successful, remove the ID from the Set
			notificationIdsNeedToBeMarkedAsSeen.delete(id);
		} catch (error) {
			// Handle any errors that occur during the update
			console.error(`Failed to update notification as seen for ID ${id}`, error);
		} finally {
			markNotificationAsReadLockAvailable = true;
		}
		console.log(`marked notification with id ${id} as seen`);
	};

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt);

		let threadMessagesQuery = client.query('event_messages');

		if (threadId) {
			threadMessagesQuery = threadMessagesQuery.Where([
				and([
					['thread_id', '=', threadId],
					['thread.event_id', '=', eventId]
				])
			]);
		} else {
			threadMessagesQuery = threadMessagesQuery.Where([
				and([
					['thread.name', '=', MAIN_THREAD],
					['thread.event_id', '=', eventId]
				])
			]);
		}

		if (maxNumMessages) {
			threadMessagesQuery = threadMessagesQuery.limit(maxNumMessages);
		} else {
			threadMessagesQuery = threadMessagesQuery.limit(maxNumMessagesLoadedPerRequest);
		}

		threadMessagesQuery = threadMessagesQuery
			.Include('user')
			.Include('seen_by', (rel) =>
				rel('seen_by')
					.Where([['user_id', '=', currUserId]])
					
			)
			.Include('emoji_reactions', (rel) =>
				rel('emoji_reactions').Select(['id', 'emoji', 'user_id'])
			)
			.Order('created_at', 'DESC')
			;

		const { unsubscribe: unsubscribeFromMessages, loadMore } = client.subscribeWithExpand(
			threadMessagesQuery,
			(results, info) => {
				if (!chatContainerRef) return;

				if (results.length == 0) {
					loaderState.complete();
				}

				// Convert messages array to a Map for quick lookup by ID
				const messageMap = new Map(messages.map((m: any) => [m.id, m]));

				// Replace old messages with new ones (if they exist), or add them if they don’t
				for (const newMessage of results) {
					messageMap.set(newMessage.id, newMessage);
				}

				// Convert back to an array and sort by created_at
				messages = Array.from(messageMap.values()).sort(
					(a, b) => new Date(a.created_at) - new Date(b.created_at)
				) as [];

				if (maxNumMessages) {
					messages = messages.slice(-maxNumMessages);
				}

				if (initialLoad) {
					scrollToOldestUnseenMessage(false);
				}
				countNumUnseenMessages();
				initialLoad = false;
				showMessagesLoading = false;
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

		loadMoreMessages = loadMore; // Save the loadMore function for pagination

		const unsubscribeFromUnreadThreadNotifs = client.subscribe(
			client
				.query('notifications')
				.Where([
					and([
						['event_id', '=', eventId],
						['extra_id', '=', threadId],
						['user_id', '=', currUserId],
						['seen_at', '=', null],
						['object_type', '=', NotificationType.NEW_MESSAGE]
					])
				])
				.Select(['id', 'object_ids'])
				,
			(results, info) => {
				// Create an array to store the IDs of messages that are marked as seen
				const seenMessageIds: Set<string> = new Set();

				// Iterate over `messages` to check if the message ID is in `seenMessageIds`
				messages.forEach((message: any) => {
					if (message.seen_by && message.seen_by.length > 0) {
						seenMessageIds.add(message.id);
					}
				});

				// Iterate over the results to collect message IDs
				results.forEach((notification: any) => {
					const messageIds = stringRepresentationToArray(notification.object_ids);
					const messageId = messageIds[0];
					// console.log('==> seenMessageIds', seenMessageIds);
					if (seenMessageIds.has(messageId)) {
						// console.log(
						// 	'==> notificationIdsNeedToBeMarkedAsSeen',
						// 	notificationIdsNeedToBeMarkedAsSeen
						// );
						// We need to mark that notification as seen
						notificationIdsNeedToBeMarkedAsSeen.add(notification.id);
						notificationIdsNeedToBeMarkedAsSeen = new Set(notificationIdsNeedToBeMarkedAsSeen);
					}
				});
			},
			(error) => {
				// handle error
				console.error('Error fetching unread notifications for thread:', error);
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log(
						"server has sent back results for the unread notifications for this thread's subscription"
					);
				}
			}
		);

		if (chatContainerRef) {
			console.log('chatContainerRef', chatContainerRef);
			chatContainerRef.addEventListener('scroll', handleScroll);
		}

		// Ensure cleanup on component destruction
		return () => {
			unsubscribeFromMessages();
			unsubscribeFromUnreadThreadNotifs();
		};
	});

	const scrollToOldestUnseenMessage = (smooth = true) => {
		requestAnimationFrame(() => {
			if (!chatContainerRef) return;
			// Calling to make sure everyone gets latest number of unread messages
			countNumUnseenMessages();

			// Get all elements with the 'unseen' class
			const unseenMessages = chatContainerRef.querySelectorAll('.message.unseen');
			numUnseenMessage = unseenMessages.length;

			// Select the last unseen message
			const lastUnseenMessage = unseenMessages[unseenMessages.length - 1];
			console.log('lastUnseenMessage', lastUnseenMessage);

			if (lastUnseenMessage) {
				lastUnseenMessage.scrollIntoView({
					block: 'center',
					behavior: smooth ? 'smooth' : 'auto'
				});
			}
		});
	};

	const countNumUnseenMessages = () => {
		if (!chatContainerRef) return;

		// Get all elements with the 'unseen' class
		const unseenMessages = chatContainerRef.querySelectorAll('.message.unseen');
		numUnseenMessage = unseenMessages.length;
	};

	const scrollToBottom = () => {
		console.log('scrolling to bottom');
		if (chatContainerRef) {
			chatContainerRef.scrollTo({
				top: chatContainerRef.scrollHeight,
				behavior: 'smooth'
			});
		}
	};

	const getOrCreateThread = async (client: WorkerClient, eventId: string, threadName: string) => {
		let thread = await getThread(client, null, eventId, threadName);

		if (thread) {
			return thread.id;
		}

		thread = await createNewThread(client, eventId, $page.data.user.id, MAIN_THREAD);
		return thread.id;
	};

	const handleSendMessage = async (message: string) => {
		const client = getFeWorkerTriplitClient($page.data.jwt);

		try {
			if (!threadId) {
				threadId = await getOrCreateThread(client, eventId, MAIN_THREAD);
			}
			console.log('Creating message for thread', threadId);
			if (!threadId) {
				return;
			}
			await sendMessage(client, eventId, threadId, $page.data.user.id, message);

			// // Always scroll to bottom when the user sends a message
			// if (userScrolledUp) {
			// 	sentMessageJustNowFromNonBottom = true;
			// }
			scrollToBottom();
		} catch (e) {
			console.error(`failed to send message for threadId ${threadId}`, e);
		}
	};

	const loadMoreOlderMessages = async () => {
		loadMoreMessagesCalled = true;
		try {
			if (loadMoreMessages && chatContainerRef) {
				await loadMoreMessages();
				console.log('data loaded!');
				loaderState.loaded();
			} else {
				console.log('no more data');
				loaderState.complete();
			}
		} catch (e) {
			console.error(e);
			loaderState.error();
		} finally {
			loadMoreMessagesCalled = false;
		}
	};

	onDestroy(() => {
		if (chatContainerRef) {
			chatContainerRef.removeEventListener('scroll', handleScroll);
		}
	});

	const scrollDownButton = () => {
		if (numUnseenMessage) {
			scrollToOldestUnseenMessage();
		} else {
			scrollToBottom();
		}
	};
</script>

<div class="relative flex h-full w-full flex-col">
	<div
		id="scroller"
		bind:this={chatContainerRef}
		class="{messages.length > 0
			? 'container-scroll overflow-y-auto'
			: ''} h-full space-y-2 rounded-t-xl bg-white bg-opacity-20 p-2 dark:bg-black dark:bg-opacity-20"
	>
		<div id="anchor"></div>

		{#if messages && messages.length > 0}
			<InfiniteLoader
				triggerLoad={loadMoreOlderMessages}
				intersectionOptions={{ rootMargin: '0px 0px 1000px 0px' }}
			>
				<!-- {#snippet loading()}
					<p class="text-black">Loading older messages...</p>
					<div class="flex w-full justify-center"><SvgLoader /></div>
				{/snippet} -->

				{#snippet error()}
					<p>Error loading messages. <button onclick={loadMoreOlderMessages}>Retry</button></p>
				{/snippet}

				{#snippet noData()}
					<p>No more messages.</p>
				{/snippet}
				{#each messages as message (message.id)}
					<Message
						{currUserId}
						{message}
						onMessageSeen={countNumUnseenMessages}
						ignoreSeenStatusPriorToThisDatetime={datetimeUserJoinedBonfire}
						{isCurrenUserEventAdmin}
						{eventId}
						canInteract={canSendIm}
					/>
				{/each}
			</InfiniteLoader>
		{:else if showMessagesLoading}
			<div class="flex h-full w-full items-center justify-center">
				<div>
					<div class="font-mono">Loading...</div>
					<SvgLoader />
				</div>
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center">
				<div class="rounded-xl bg-white p-4 dark:bg-slate-900">No messages yet</div>
			</div>
		{/if}

		<!-- ✅ Position button at the bottom of the chat container -->
		{#if userScrolledUp}
			<div class="absolute bottom-20 z-10 flex w-full items-center justify-center">
				<Button
					onclick={scrollDownButton}
					class="rounded-full bg-blue-700 p-2 px-5 text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-gray-700"
				>
					<div class="flex flex-col items-center justify-center">
						{#if numUnseenMessage > 0}
							<span class="text-xs">{numUnseenMessage} unread</span>
						{:else}
							<ChevronDown class="!h-4 !w-4 sm:!h-5 sm:!w-5" />
						{/if}
					</div>
				</Button>
			</div>
		{/if}
	</div>

	<ImInput {handleSendMessage} {canSendIm} />
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

	/*
	Prevent scrolling automatically when new messages are added by others
	https://css-tricks.com/books/greatest-css-tricks/pin-scrolling-to-bottom/
	*/
	#scroller * {
		overflow-anchor: none;
	}
	#anchor {
		overflow-anchor: auto;
		height: 1px;
	}
</style>
