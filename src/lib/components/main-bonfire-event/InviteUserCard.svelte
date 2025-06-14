<script lang="ts">
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { Button } from '../ui/button';
	import { Badge } from '../ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { MoreHorizontal, UserX } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let {
		user,
		eventId,
		onInvite,
		isInviting = false,
		buttonText = 'Invite',
		buttonVariant = 'default',
		onUserBlocked = null
	} = $props();

	let isBlocking = $state(false);

	const handleInvite = async () => {
		if (onInvite) {
			await onInvite(user.id);
		}
	};

	const handleBlockUser = async () => {
		if (isBlocking) return;
		
		isBlocking = true;
		try {
			const response = await fetch('/api/users/block', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: user.id
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to block user');
			}

			toast.success(`Blocked ${user.username}`);
			
			// Notify parent component to remove user from list
			if (onUserBlocked) {
				onUserBlocked(user.id);
			}
		} catch (error) {
			console.error('Error blocking user:', error);
			toast.error(error.message || 'Failed to block user');
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

	<div class="flex items-center gap-2">
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

		<!-- 3-dot menu -->
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild let:builder>
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
					{...builder}
				>
					<MoreHorizontal class="h-4 w-4" />
					<span class="sr-only">Open menu</span>
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item
					class="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
					onclick={handleBlockUser}
					disabled={isBlocking}
				>
					<UserX class="mr-2 h-4 w-4" />
					{#if isBlocking}
						Blocking...
					{:else}
						Block User
					{/if}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</div>
