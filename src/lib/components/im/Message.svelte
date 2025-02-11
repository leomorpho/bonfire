<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { EventMessage } from '$lib/types';
	import { formatHumanReadableWithContext } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import ProfileAvatar from '../ProfileAvatar.svelte';

	let {
		currUserId,
		message,
		url,
		onMessageSeen = null,
		ignoreSeenStatusPriorToThisDatetime = null
	} = $props<{
		currUserId: string;
		message: EventMessage;
		url?: string; // Optional property
		onMessageSeen?: () => void;
		ignoreSeenStatusPriorToThisDatetime: string;
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

	const markMessageAsSeen = async (messageId: string) => {
		const client = getFeTriplitClient($page.data.jwt);

		try {
			await client.insert('event_message_seen', {
				message_id: messageId,
				user_id: $page.data.user.id
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

	$effect(() => {
		if (!isOwnMessage && isUnseen && messageRef) {
			// Remove previous observer to avoid duplicates
			if (observer) {
				observer.disconnect();
			}

			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
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

<div
	id="message-{message.id}"
	bind:this={messageRef}
	class="message {!isOwnMessage && isUnseen ? 'unseen' : ''} flex w-full items-end p-2 {isOwnMessage
		? 'justify-end'
		: 'justify-start'} gap-2.5"
>
	<div class="flex gap-2.5 ${isOwnMessage ? 'items-end' : 'items-start'}">
		{#if !isOwnMessage}
			<div class="self-end">{@render avatar()}</div>
		{/if}
		<div
			class="leading-1.5 flex w-full max-w-[320px] flex-col p-4
			{isOwnMessage ? 'from-me rounded-s-xl rounded-se-xl bg-blue-100 p-4 dark:bg-blue-600' : ''}
	{!isOwnMessage && !isUnseen
				? 'from-them rounded-e-xl rounded-ss-xl bg-gray-100 p-4 dark:bg-gray-800'
				: ''}
				{!isOwnMessage && isUnseen
				? 'from-them rounded-e-xl rounded-ss-xl bg-green-100 p-4 dark:bg-green-900'
				: ''}"
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
				{message.content}
			</p>
			<!-- <span class="text-sm font-normal text-gray-500 dark:text-gray-400">{Delivered}</span> -->
		</div>
		{#if isOwnMessage}
			<div class="self-end">
				{@render avatar()}
			</div>
		{/if}
	</div>
</div>
