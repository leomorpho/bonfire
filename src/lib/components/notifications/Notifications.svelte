<script lang="ts">
	import Notification from './Notification.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import SvgLoader from '../SvgLoader.svelte';
	import { announcementsStore } from '$lib/stores';

	let { children } = $props(); // Allow custom button text or children
	let isDialogOpen = $state(true); // Dialog open state

	// Read notifications and loading state from the store
	let notifications = $state($announcementsStore.announcementsSubset);
	let notificationsLoading = $state($announcementsStore.announcementsLoading);

	function toggleDialog() {
		isDialogOpen = !isDialogOpen;
		console.log('Dialog state changed:', isDialogOpen);
	}
</script>

<!-- Notifications Icon/Button -->
<button onclick={toggleDialog} aria-label="Notifications">
	{@render children?.()}

	<!-- Show a count if there are unseen notifications -->
	{#if notifications.filter((n) => !n.seen_at).length > 0}
		<span
			class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
		>
			{notifications.filter((n) => !n.seen_at).length}
		</span>
	{/if}
</button>

<!-- Notifications Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="h-full">
		<ScrollArea>
			<Dialog.Header class="mx-4">
				<Dialog.Title>Your Notifications</Dialog.Title>
				<Dialog.Description>
					{#if notificationsLoading}
						<div class="flex w-full items-center justify-center">
							<SvgLoader />
						</div>
					{:else if notifications.length === 0}
						<p class="text-gray-400">You have no notifications.</p>
					{:else}
						{#each notifications as notification}
							<div class="my-3">
								<Notification {notification} />
							</div>
						{/each}
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
