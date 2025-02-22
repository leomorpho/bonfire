<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { EventMessage } from '$lib/types';
	import {
		arrayToStringRepresentation,
		formatHumanReadableWithContext,
		isMobile
	} from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import { and } from '@triplit/client';
	import { EMOJI_REACTION_TYPE, NotificationType } from '$lib/enums';
	import MessageContextMenu from './MessageContextMenu.svelte';
	import { toggleEmojiReaction } from '$lib/emoji';
	import EmojiContextMenu from './EmojiContextMenu.svelte';

	let {
		currUserId,
		message,
		eventId,
		onMessageSeen = null,
		ignoreSeenStatusPriorToThisDatetime = null,
		isCurrenUserEventAdmin = false,
		canInteract = true
	} = $props<{
		currUserId: string;
		message: EventMessage;
		url?: string; // Optional property
		onMessageSeen?: () => void;
		ignoreSeenStatusPriorToThisDatetime: string;
		isCurrenUserEventAdmin: boolean;
	}>();

	// Check if the message was sent by the current user
	let isOwnMessage = $derived(message.user_id == currUserId);

	// TODO: we might not want to set messages as unseen prior to a user joining the bonfire, aka set such messages as seen by default.

	// Determine if the message is seen by the current user
	let isUnseen = $state(false);

	// Create a map of emoji count to emojis
	let emojiCountMap = $state(new Map());
	let emojiReactionsMap = $state(new Map());

	$effect(() => {
		if (!message || !message.emoji_reactions) return;

		// Create fresh maps every time
		const newEmojiCountMap = new Map();
		const newEmojiReactionsMap = new Map();

		for (const reaction of message.emoji_reactions) {
			// Count each emoji
			newEmojiCountMap.set(reaction.emoji, (newEmojiCountMap.get(reaction.emoji) || 0) + 1);

			// Collect all reactions for each emoji
			if (!newEmojiReactionsMap.has(reaction.emoji)) {
				newEmojiReactionsMap.set(reaction.emoji, []);
			}
			newEmojiReactionsMap.get(reaction.emoji).push(reaction);
		}

		// Assign new maps to trigger reactivity
		emojiCountMap = newEmojiCountMap;
		emojiReactionsMap = newEmojiReactionsMap;
	});

	$effect(() => {
		if (ignoreSeenStatusPriorToThisDatetime) {
			const ignoreBefore = new Date(ignoreSeenStatusPriorToThisDatetime);
			const messageCreatedAt = new Date(message.created_at);

			if (!isNaN(ignoreBefore.getTime()) && messageCreatedAt < ignoreBefore) {
				isUnseen = false;
				return;
			}
		}

		isUnseen = message.seen_by
			? !message.seen_by.some((seen: any) => seen.user_id === currUserId)
			: true;
	});

	const isElementReallyVisible = (element: HTMLElement) => {
		if (!element) return false;

		// If the element is `display: none`, `offsetParent` will be null
		if (!element.offsetParent) return false;

		// Check if it's inside the viewport
		const rect = element.getBoundingClientRect();
		return rect.top >= 0 && rect.bottom <= window.innerHeight;
	};

	const markMessageAsSeen = async (messageId: string) => {
		const client = getFeTriplitClient($page.data.jwt);

		let existingNotif: any;

		try {
			// Fetch the notification
			const results = await client.fetch(
				client
					.query('notifications')
					.where([
						and([
							['user_id', '=', $page.data.user.id],
							['seen_at', '=', null],
							['object_ids', '=', arrayToStringRepresentation([messageId])],
							['object_type', '=', NotificationType.NEW_MESSAGE]
						])
					])
					.build()
			);
			if (results.length == 1) {
				existingNotif = results[0];
			}
		} catch (e) {
			console.error(
				`Failed to get existing unseen notification for user ${$page.data.user.id} and message ${messageId}`,
				e
			);
		}

		try {
			await client.transact(async (tx: any) => {
				try {
					// Insert the 'event_message_seen' record
					await tx.insert('event_message_seen', {
						message_id: messageId,
						user_id: $page.data.user.id
					});

					if (existingNotif) {
						// Update the notification to mark it as seen
						await tx.update('notifications', existingNotif.id, async (e: any) => {
							e.seen_at = new Date();
						});
					}
				} catch (error) {
					console.error(
						`Failed to set notification as seen for user ${$page.data.user.id} and message ${messageId}`,
						error
					);
					// Optionally, you can decide to cancel the transaction if any part fails
					await tx.cancel();
				}
			});

			// ✅ Update local `seen_by` array for reactivity
			message.seen_by = [...(message.seen_by || []), { user_id: currUserId }];

			// ✅ Trigger UI update
			isUnseen = false;

			if (onMessageSeen) {
				onMessageSeen();
			}
			console.log(`Message ${messageId} marked as seen`);
		} catch (error) {
			console.error('Error marking message as seen:', error);
		}
	};

	let messageRef: HTMLDivElement | null = null;
	let observer: IntersectionObserver;
	let pressTimer: NodeJS.Timeout | null = $state(null);
	let isHolding = $state(false);

	const handlePointerDown = (event: PointerEvent) => {
		if (isMobile()) {
			pressTimer = setTimeout(() => {
				isHolding = true;

				// Reset `isHolding` after 500ms
				setTimeout(() => {
					isHolding = false;
				}, 500);
			}, 0); // Long press time
		}
	};

	onMount(() => {
		if (messageRef) {
			messageRef.addEventListener('pointerdown', handlePointerDown);
		}
	});

	onDestroy(() => {
		if (messageRef) {
			messageRef.removeEventListener('pointerdown', handlePointerDown);
		}
	});

	$effect(() => {
		if (!isOwnMessage && isUnseen && messageRef) {
			// Remove previous observer to avoid duplicates
			if (observer) {
				observer.disconnect();
			}

			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && isElementReallyVisible(entry.target as HTMLElement)) {
							// ✅ Mark as seen & update UI
							markMessageAsSeen(message.id);
							observer?.unobserve(entry.target); // Stop observing
						}
					});
				},
				{
					root: null, // Observe within viewport
					threshold: 1 // 100% visibility required
				}
			);

			observer.observe(messageRef);
		}
	});

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});

	// Handle emoji selection
	const toggleEmoji = async (emoji: any) => {
		console.log('Add emoji', emoji);
		const client = await getFeTriplitClient($page.data.jwt);
		await toggleEmojiReaction(
			client,
			$page.data.user.id,
			eventId,
			message.id,
			EMOJI_REACTION_TYPE.MESSAGE,
			emoji
		);
	};
</script>

{#snippet avatar()}
	<ProfileAvatar userId={message.user?.id} baseHeightPx={30} />
{/snippet}

<div class="relative py-1">
	<div
		data-message-id={message.id}
		bind:this={messageRef}
		class="message {!isOwnMessage && isUnseen
			? 'unseen'
			: ''} flex w-full items-end p-2 {isOwnMessage ? 'justify-end' : 'justify-start'} gap-2.5"
	>
		<div class="flex gap-2.5 ${isOwnMessage ? 'items-end' : 'items-start'}">
			{#if !isOwnMessage}
				<div class="self-end">{@render avatar()}</div>
			{/if}
			<MessageContextMenu {message} {isOwnMessage} {isCurrenUserEventAdmin} {eventId} {canInteract}>
				<div
					class="leading-1.5 flex w-full max-w-[320px] flex-col p-4
			{isOwnMessage ? 'from-me rounded-s-xl rounded-se-xl bg-blue-100 p-4 dark:bg-blue-600' : ''}
	{!isOwnMessage && !isUnseen
						? 'from-them rounded-e-xl rounded-ss-xl bg-gray-100 p-4 dark:bg-gray-800'
						: ''}
				{!isOwnMessage && isUnseen
						? 'from-them rounded-e-xl rounded-ss-xl bg-green-100 p-4 dark:bg-green-900'
						: ''}
					{isHolding ? 'scale-110 transition-transform duration-150 ease-in-out' : ''}"
				>
					<div class="flex items-center space-x-2 rtl:space-x-reverse">
						<span class="text-sm font-semibold text-gray-900 dark:text-white"
							>{message.user?.username}</span
						>
						<span class="text-sm font-normal text-gray-500 dark:text-gray-400"
							>{formatHumanReadableWithContext(message.created_at)}</span
						>
					</div>
					<p class="py-2.5 text-sm font-normal text-gray-900 dark:text-white">
						{#if message.deleted_by_user_id}
							<span class="italic">This message was deleted</span>
						{:else}
							{message.content}
						{/if}
					</p>
					<!-- <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{Delivered}</span> -->
				</div>
			</MessageContextMenu>
			{#if isOwnMessage}
				<div class="self-end">
					{@render avatar()}
				</div>
			{/if}
		</div>
	</div>
	<div class="z-5 absolute -bottom-3 {isOwnMessage ? 'right-8' : 'left-8'}">
		{#if message.emoji_reactions}
			<span class="mx-1 flex w-fit flex-wrap items-center px-1 text-xl">
				{#each Array.from(emojiCountMap.entries()) as [emoji, count]}
					<EmojiContextMenu
						toggleEmoji={toggleEmoji(emoji)}
						reactions={emojiReactionsMap.get(emoji)}
						{currUserId}
					>
						<button
							class="flex flex-row items-center rounded-full bg-slate-700 bg-opacity-50 p-1 transition-all duration-200 ease-in-out hover:cursor-pointer hover:text-2xl"
						>
							{emoji}
							{#if count > 1}
								<span class="mx-1 text-sm text-gray-300">{count}</span>
							{/if}
						</button>
					</EmojiContextMenu>
				{/each}
			</span>
		{/if}
	</div>
</div>
