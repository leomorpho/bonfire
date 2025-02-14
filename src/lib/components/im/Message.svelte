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
	import { NotificationType } from '$lib/enums';
	import MessageContextMenu from './MessageContextMenu.svelte';

	let {
		currUserId,
		message,
		url,
		onMessageSeen = null,
		ignoreSeenStatusPriorToThisDatetime = null,
		currenUserIsEventAdmin = false,
		eventId
	} = $props<{
		currUserId: string;
		message: EventMessage;
		url?: string; // Optional property
		onMessageSeen?: () => void;
		ignoreSeenStatusPriorToThisDatetime: string;
		currenUserIsEventAdmin: boolean;
	}>();

	// Check if the message was sent by the current user
	let isOwnMessage = $derived(message.user_id == currUserId);

	// TODO: we might not want to set messages as unseen prior to a user joining the bonfire, aka set such messages as seen by default.

	// Determine if the message is seen by the current user
	let isUnseen = $state(false);

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
</script>

{#snippet avatar()}
	<ProfileAvatar {url} username={message.user?.username} isTempUser={false} baseHeightPx={30} />
{/snippet}

<div class="relative py-3">
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
			<MessageContextMenu {message} {isOwnMessage} {currenUserIsEventAdmin} {eventId}>
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
	<div class="z-5 absolute -bottom-2 {isOwnMessage ? 'right-8' : 'left-8'}">
		{#if message.emoji_reactions}
			<span class="flex w-fit flex-wrap items-center rounded-full bg-slate-700 bg-opacity-50 px-2 text-xl">
				{#each message.emoji_reactions as emojiReaction}
					<span class="p-0 transition-all duration-200 ease-in-out hover:px-1 hover:text-2xl">
						{emojiReaction.emoji}
					</span>
				{/each}
			</span>
		{/if}
	</div>
</div>
