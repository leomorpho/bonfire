<script lang="ts">
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { Button } from '../ui/button';
	import { Badge } from '../ui/badge';

	let {
		user,
		eventId,
		onInvite,
		isInviting = false,
		buttonText = 'Invite',
		buttonVariant = 'default'
	} = $props();

	const handleInvite = async () => {
		if (onInvite) {
			await onInvite(user.id);
		}
	};
</script>

<div
	class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
>
	<div class="flex items-center space-x-3">
		<ProfileAvatar
			userId={user.id}
			baseHeightPx={48}
			showRemoveUser={false}
			viewerIsEventAdmin={false}
			userIsEventAdmin={false}
		/>
		<div class="flex flex-col">
			<span class="font-medium text-gray-900 dark:text-gray-100">
				{user.username}
			</span>
			<div class="flex items-center space-x-2">
				<Badge variant="secondary" class="text-xs">
					{user.sharedEventsCount} shared event{user.sharedEventsCount !== 1 ? 's' : ''}
				</Badge>
			</div>
		</div>
	</div>

	<Button
		size="sm"
		variant={buttonVariant}
		onclick={handleInvite}
		disabled={isInviting}
		class="min-w-16"
	>
		{#if isInviting}
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></div>
		{:else}
			{buttonText}
		{/if}
	</Button>
</div>
