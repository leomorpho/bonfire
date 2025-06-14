<script lang="ts">
	import { formatHumanReadableWithContext } from '$lib/utils';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { 
		conversation, 
		onClick,
		isSelected = false 
	} = $props<{
		conversation: any;
		onClick: () => void;
		isSelected?: boolean;
	}>();

	// Get the last message preview
	let lastMessage = $derived(
		conversation.messages && conversation.messages.length > 0
			? conversation.messages[conversation.messages.length - 1]
			: null
	);

	// Count unread messages (simplified - in a real app you'd track this properly)
	let hasUnread = $derived(
		conversation.messages && conversation.messages.some((msg: any) => 
			!msg.seen_by || !msg.seen_by.some((seen: any) => seen.user_id !== conversation.user_id)
		)
	);
</script>

<div
	class={`cursor-pointer border-b border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
		isSelected ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''
	}`}
	onclick={onClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick();
		}
	}}
>
	<div class="flex items-start gap-3">
		<!-- User Avatar -->
		<ProfileAvatar 
			userId={conversation.user?.id} 
			baseHeightPx={40}
			class="flex-shrink-0"
		/>

		<!-- Conversation Details -->
		<div class="flex-1 min-w-0">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">
						{conversation.user?.username || 'Unknown User'}
					</h3>
					
					<!-- Status Badge -->
					<Badge 
						variant={conversation.status === 'open' ? 'default' : 'secondary'}
						class="text-xs"
					>
						{conversation.status}
					</Badge>
				</div>

				<!-- Timestamp -->
				{#if conversation.last_message_at}
					<span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
						{formatHumanReadableWithContext(conversation.last_message_at)}
					</span>
				{/if}
			</div>

			<!-- Last Message Preview -->
			{#if lastMessage}
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 truncate">
					{#if lastMessage.is_admin_message}
						<span class="text-green-600 dark:text-green-400">Support:</span>
					{/if}
					{lastMessage.content}
				</p>
			{:else}
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-500 italic">
					No messages yet
				</p>
			{/if}

			<!-- Unread Indicator -->
			{#if hasUnread}
				<div class="mt-2 flex items-center gap-1">
					<div class="h-2 w-2 rounded-full bg-blue-500"></div>
					<span class="text-xs text-blue-600 dark:text-blue-400">New messages</span>
				</div>
			{/if}
		</div>
	</div>
</div>