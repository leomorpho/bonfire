<script lang="ts">
	import { formatHumanReadableWithContext } from '$lib/utils';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';

	let {
		message,
		currUserId,
		onMessageSeen = null
	} = $props<{
		message: any;
		currUserId: string;
		onMessageSeen?: () => void;
	}>();

	// Check if the message was sent by the current user
	let isOwnMessage = $derived(message.user_id === currUserId);
	
	// Check if this is an admin message
	let isAdminMessage = $derived(message.is_admin_message);

	// Determine if the message is seen by the current user
	let isUnseen = $state(false);

	$effect(() => {
		isUnseen = message.seen_by
			? !message.seen_by.some((seen: any) => seen.user_id === currUserId)
			: true;
	});

	// Auto-mark message as seen when it comes into view
	let messageElement: HTMLElement;

	$effect(() => {
		if (messageElement && isUnseen && onMessageSeen) {
			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting) {
						onMessageSeen();
						observer.disconnect();
					}
				},
				{ threshold: 0.5 }
			);

			observer.observe(messageElement);

			return () => observer.disconnect();
		}
	});
</script>

<div
	bind:this={messageElement}
	class={`mb-4 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
>
	<div class={`flex max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
		<!-- Avatar -->
		{#if !isOwnMessage}
			<ProfileAvatar 
				userId={message.user?.id} 
				baseHeightPx={32}
				class="flex-shrink-0"
			/>
		{/if}

		<!-- Message Content -->
		<div
			class={`rounded-lg px-4 py-2 ${
				isOwnMessage
					? 'bg-blue-500 text-white'
					: isAdminMessage
					? 'bg-green-100 text-green-900 border border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800'
					: 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
			} ${isUnseen && !isOwnMessage ? 'ring-2 ring-blue-400' : ''}`}
		>
			<!-- Admin Badge -->
			{#if isAdminMessage && !isOwnMessage}
				<div class="mb-1 text-xs font-semibold text-green-600 dark:text-green-400">
					Support Team
				</div>
			{/if}

			<!-- Message Text -->
			<div class="break-words text-sm leading-relaxed">
				{message.content}
			</div>

			<!-- Timestamp -->
			<div
				class={`mt-1 text-xs ${
					isOwnMessage
						? 'text-blue-100'
						: isAdminMessage
						? 'text-green-600 dark:text-green-400'
						: 'text-gray-500 dark:text-gray-400'
				}`}
			>
				{formatHumanReadableWithContext(message.created_at)}
			</div>
		</div>

		<!-- Own message avatar -->
		{#if isOwnMessage}
			<ProfileAvatar 
				userId={message.user?.id} 
				baseHeightPx={32}
				class="flex-shrink-0"
			/>
		{/if}
	</div>
</div>