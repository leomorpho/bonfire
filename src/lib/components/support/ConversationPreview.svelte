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

	// Simplified message preview (removed dependency on nested messages)
	let lastMessage = $derived(null); // Will implement separately if needed
	let hasUnread = $derived(false); // Will implement separately if needed
</script>

<div
	class={`cursor-pointer border-b border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
		isSelected ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : ''
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
		<ProfileAvatar userId={conversation.user?.id} baseHeightPx={40} class="flex-shrink-0" />

		<!-- Conversation Details -->
		<div class="min-w-0 flex-1">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h3 class="truncate font-medium text-gray-900 dark:text-gray-100">
						{conversation.user?.username || 'Unknown User'}
					</h3>

					<!-- Status Badge -->
					<Badge variant={conversation.status === 'open' ? 'default' : 'secondary'} class="text-xs">
						{conversation.status}
					</Badge>
				</div>

				<!-- Timestamp -->
				{#if conversation.last_message_at}
					<span class="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
						{formatHumanReadableWithContext(conversation.last_message_at)}
					</span>
				{/if}
			</div>

			<!-- Last Message Preview -->
			<p class="mt-1 text-sm italic text-gray-500 dark:text-gray-500">
				{conversation.last_message_at ? 'Recent activity' : 'No messages yet'}
			</p>
		</div>
	</div>
</div>
