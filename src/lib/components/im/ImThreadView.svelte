<script lang="ts">
	import { page } from '$app/stores';
	import { createNewThread, getThread, MAIN_THREAD, sendMessage } from '$lib/im';
	import { getFeTriplitClient } from '$lib/triplit';
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

	let {
		eventId,
		currUserId,
		profileImageMap,
		threadId = null,
		canSendIm = true,
		maxNumMessages = null,
		datetimeUserJoinedBonfire = null
	} = $props();

	let chatContainerRef: HTMLDivElement | null = null;
	let userScrolledUp = $state(false);
	let sentMessageJustNowFromNonBottom = $state(false);
	let showMessagesLoading = $state(true);
	let initialLoad = $state(true);
	let messages: any = $state([]);
	let numUnseenMessage: number = $state(0);
	let loadMoreMessages: ((pageSize?: number) => void) | undefined = $state();

	const handleScroll = () => {
		if (!chatContainerRef) return;

		// Check if the user has scrolled up (not at the bottom)
		const isAtBottom = chatContainerRef.scrollTop == 0;
		userScrolledUp = !isAtBottom;
	};

	$effect(() => {
		if (!userScrolledUp) {
			// Reset once we made it to bottom of scrollable area
			sentMessageJustNowFromNonBottom = false;
		}
	});

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
			const client = getFeTriplitClient($page.data.jwt);

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

		threadMessagesQuery = threadMessagesQuery
			.include('user')
			.include('seen_by', (rel) =>
				rel('seen_by')
					.where([['user_id', '=', currUserId]])
					.build()
			)
			// .include('seen_by')
			.order('created_at', 'DESC')
			.build();

		const { unsubscribe: unsubscribeFromMessages, loadMore } = client.subscribeWithExpand(
			threadMessagesQuery,
			(results, info) => {
				if (!chatContainerRef) return;

				showMessagesLoading = false;
				// Capture current scroll position BEFORE new messages load
				const prevScrollTop = chatContainerRef.scrollTop;
				const prevScrollHeight = chatContainerRef.scrollHeight;

				// Temporarily disable scrolling
				const freezeScroll = () => {
					window.scrollTo(0, prevScrollTop);
				};

				if (userScrolledUp || sentMessageJustNowFromNonBottom) {
					window.addEventListener('scroll', freezeScroll, { passive: false });
				}

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

				// Restore scroll position AFTER the DOM updates
				requestAnimationFrame(() => {
					if (!chatContainerRef) return;
					const newScrollHeight = chatContainerRef.scrollHeight;

					if (!userScrolledUp || sentMessageJustNowFromNonBottom) {
						scrollToBottom();
					} else {
						chatContainerRef.scrollTop = prevScrollTop - (newScrollHeight - prevScrollHeight);
					}

					// Re-enable scrolling
					window.removeEventListener('scroll', freezeScroll);
				});

				if (initialLoad) {
					scrollToOldestUnseenMessage(false);
				}
				loadMoreMessages = loadMore; // Save the loadMore function for pagination
				countNumUnseenMessages();
				initialLoad = false;
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

		const unsubscribeFromUnreadThreadNotifs = client.subscribe(
			client
				.query('notifications')
				.where([
					and([
						['event_id', '=', eventId],
						['extra_id', '=', threadId],
						['user_id', '=', currUserId],
						['seen_at', '=', null],
						['object_type', '=', NotificationType.NEW_MESSAGE]
					])
				])
				.select(['id', 'object_ids'])
				.build(),
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
					console.log('==> notification', notification);
					const messageIds = stringRepresentationToArray(notification.object_ids);
					const messageId = messageIds[0];
					console.log('==> seenMessageIds', seenMessageIds);
					if (seenMessageIds.has(messageId)) {
						console.log(
							'==> notificationIdsNeedToBeMarkedAsSeen',
							notificationIdsNeedToBeMarkedAsSeen
						);
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
		const client = getFeTriplitClient($page.data.jwt);

		try {
			if (!threadId) {
				threadId = await getOrCreateThread(client, eventId, MAIN_THREAD);
			}
			console.log('Creating message for thread', threadId);
			if (!threadId) {
				return;
			}
			await sendMessage(client, eventId, threadId, $page.data.user.id, message);

			// Always scroll to bottom when the user sends a message
			if (userScrolledUp) {
				sentMessageJustNowFromNonBottom = true;
			}
		} catch (e) {
			console.error(`failed to send message for threadId ${threadId}`, e);
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
			{#each messages as message}
				<Message
					url={profileImageMap.get(message.user_id)?.small_image_url}
					{currUserId}
					{message}
					onMessageSeen={countNumUnseenMessages}
					ignoreSeenStatusPriorToThisDatetime={datetimeUserJoinedBonfire}
				/>
			{/each}
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
