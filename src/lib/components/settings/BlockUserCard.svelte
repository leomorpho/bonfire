<script lang="ts">
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { Button } from '../ui/button';
	import { Badge } from '../ui/badge';
	import { toast } from 'svelte-sonner';

	let { user, onBlock } = $props();
	let isBlocking = $state(false);

	const handleBlock = async () => {
		isBlocking = true;
		try {
			const response = await fetch('/api/users/block', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: user.id })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to block user');
			}

			toast.success(`Blocked ${user.username}`);
			if (onBlock) {
				onBlock(user.id);
			}
		} catch (err) {
			console.error('Block error:', err);
			toast.error(err.message || 'Failed to block user');
		} finally {
			isBlocking = false;
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

	<Button size="sm" variant="outline" onclick={handleBlock} disabled={isBlocking} class="min-w-16 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300">
		{#if isBlocking}
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></div>
		{:else}
			Block
		{/if}
	</Button>
</div>