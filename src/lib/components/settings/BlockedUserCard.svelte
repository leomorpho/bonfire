<script lang="ts">
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { Button } from '../ui/button';
	import { toast } from 'svelte-sonner';

	let { user, onUnblock } = $props();
	let isUnblocking = $state(false);

	const handleUnblock = async () => {
		isUnblocking = true;
		try {
			const response = await fetch('/api/users/block', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId: user.id })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to unblock user');
			}

			toast.success(`Unblocked ${user.username}`);
			if (onUnblock) {
				onUnblock(user.id);
			}
		} catch (err) {
			console.error('Unblock error:', err);
			toast.error(err.message || 'Failed to unblock user');
		} finally {
			isUnblocking = false;
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
			<span class="text-sm text-gray-500 dark:text-gray-400">
				Blocked on {new Date(user.blocked_at).toLocaleDateString()}
			</span>
		</div>
	</div>

	<Button size="sm" variant="outline" onclick={handleUnblock} disabled={isUnblocking} class="min-w-20">
		{#if isUnblocking}
			<div
				class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
			></div>
		{:else}
			Unblock
		{/if}
	</Button>
</div>