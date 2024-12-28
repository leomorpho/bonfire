<script lang="ts">
	import Notification from './Notification.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import SvgLoader from '../SvgLoader.svelte';
	import { announcementsStore } from '$lib/stores';

	let { children } = $props(); // Allow custom button text or children
	let isDialogOpen = $state(false); // Dialog open state

	// Read notifications and loading state from the store
	let allNotifications = $state([]);
	let notificationsLoading = $state();
	let totalCount = $state();

	// Subscribe to the store
	announcementsStore.subscribe((state) => {
		allNotifications = state.allNotifications;
		notificationsLoading = state.notificationsLoading;
		totalCount = state.totalCount;
	});

	function toggleDialog() {
		isDialogOpen = !isDialogOpen;
	}
</script>

<!-- Notifications Icon/Button -->
<button onclick={toggleDialog} aria-label="Notifications">
	{@render children?.()}

	<!-- Show a count if there are unseen notifications -->
	{#if allNotifications.filter((n) => !n.seen_at).length > 0}
		<span
			class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
		>
			{allNotifications.filter((n) => !n.seen_at).length}
		</span>
	{/if}
</button>

<!-- Notifications Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="flex h-full items-center justify-center">
		<ScrollArea>
			<Dialog.Header class="mx-4">
				<Dialog.Title>Your Notifications</Dialog.Title>
				<Dialog.Description>
					{#if notificationsLoading}
						<!-- Show loader while loading -->
						<div class="flex w-full items-center justify-center">
							<SvgLoader />
						</div>
					{:else if isDialogOpen && allNotifications.length === 0}
						<!-- Center 'No notifications' vertically and horizontally -->
						<div class="flex h-full w-full items-center justify-center text-center">
							<p class="text-gray-400">You have no notifications.</p>
						</div>
					{:else}
						<!-- Show notifications if available -->
						{#each allNotifications as notification}
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
