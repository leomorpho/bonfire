<script lang="ts">
	import type { EventMessage } from '$lib/types';
	import { formatHumanReadableWithContext } from '$lib/utils';
	import ProfileAvatar from '../ProfileAvatar.svelte';

	let { currUserId, message, url } = $props<{
		currUserId: string;
		message: EventMessage;
		url?: string; // Optional property
	}>();
	// Check if the message was sent by the current user
	let isOwnMessage = message.user_id === currUserId;
</script>

{#snippet avatar()}
	<ProfileAvatar {url} username={message.user?.username} isTempUser={false} />
{/snippet}

<div class=" flex w-full items-end p-2 {isOwnMessage ? 'justify-end' : 'justify-start'} gap-2.5">
	<div class="flex gap-2.5 ${isOwnMessage ? 'items-end' : 'items-start'}">
		{#if !isOwnMessage}
			<div class="self-end">{@render avatar()}</div>
		{/if}
		<div
			class="leading-1.5 flex w-full max-w-[320px] flex-col p-4 {isOwnMessage
				? 'from-me rounded-s-xl rounded-se-xl border-blue-200 bg-blue-100 p-4 dark:bg-blue-600'
				: 'from-them rounded-e-xl rounded-ss-xl border-gray-200 bg-gray-100 p-4 dark:bg-gray-800'}"
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
