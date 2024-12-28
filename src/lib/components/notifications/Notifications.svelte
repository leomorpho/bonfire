<script lang="ts">
	import Notification from './Notification.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import SvgLoader from '../SvgLoader.svelte';
	import { announcementsStore } from '$lib/stores';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { NotificationTypescriptType } from '$lib/types';

	let { children } = $props(); // Allow custom button text or children
	let isDialogOpen = $state(false); // Dialog open state

	let userId = $state('');

	// Read notifications and loading state from the store
	let allUnreadNotifications = $state([]);
	let allSeenNotifications = $state([]);
	let notificationsLoading = $state();
	let totalCount = $state();

	// Track pagination for seen notifications
	let loadMoreSeen: ((pageSize?: number) => void) | undefined;

	// Subscribe to the store
	announcementsStore.subscribe((state) => {
		allUnreadNotifications = state.allUnreadNotifications;
		notificationsLoading = state.notificationsLoading;
		totalCount = state.totalCount;
	});

	// Initialize the seen notifications subscription
	async function initSeenNotifications() {
		const client = getFeTriplitClient($page.data.jwt);

		const query = client
			.query('notifications')
			.where([
				['user_id', '=', userId],
				['seen_at', '!=', null]
			])
			.limit(20) // Initial limit
			.order('created_at', 'DESC');

		const { unsubscribe, loadMore } = client.subscribeWithExpand(
			query.build(),
			(results) => {
				console.log('Loaded more seen notifications');
				allSeenNotifications = [...allSeenNotifications, ...results] as [];
			},
			(error) => {
				console.error('Error fetching seen notifications:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log('Seen notifications fetched from server');
				}
			}
		);

		loadMoreSeen = loadMore; // Save the loadMore function for pagination

		// Ensure cleanup on component destruction
		return () => unsubscribe();
	}

	// Initialize subscriptions on mount
	onMount(() => {
		const init = async () => {
			userId = (await waitForUserId()) as string;
		};
		init();
	});

	// Watch for dialog state changes
	$effect(() => {
		if (isDialogOpen && userId) {
			console.log('calling initSeenNotifications');
			initSeenNotifications();
		}
	});

	function toggleDialog() {
		isDialogOpen = !isDialogOpen;
		// console.log('isDialogOpen', isDialogOpen);
	}

	function loadMoreSeenNotifications() {
		if (loadMoreSeen) {
			loadMoreSeen(10); // Load the next 10 notifications
		}
	}
</script>

<!-- Notifications Icon/Button -->
<button onclick={toggleDialog} aria-label="Notifications">
	{@render children?.()}

	<!-- Show a count if there are unseen notifications -->
	{#if allUnreadNotifications.filter((n: NotificationTypescriptType) => !n.seen_at).length > 0}
		<span
			class="absolute right-0 top-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
		>
			{allUnreadNotifications.filter((n: NotificationTypescriptType) => !n.seen_at).length}
		</span>
	{/if}
</button>

<!-- Notifications Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="flex h-full items-center justify-center sm:h-[90vh]">
		<ScrollArea>
			<Dialog.Header class="mx-4">
				<Dialog.Title>Your Notifications</Dialog.Title>
				<Dialog.Description>
					{#if notificationsLoading}
						<!-- Show loader while loading -->
						<div class="flex w-full items-center justify-center">
							<SvgLoader />
						</div>
					{:else if isDialogOpen && allUnreadNotifications.length === 0}
						<!-- Center 'No notifications' vertically and horizontally -->
						<div class="flex h-full w-full items-center justify-center text-center">
							<p class="text-gray-400">You have no notifications.</p>
						</div>
					{:else}
						<!-- Show unread notifications -->
						<h3 class="text-lg font-bold">Unread Notifications</h3>
						{#each allUnreadNotifications as notification}
							<div class="my-3">
								<Notification {notification} />
							</div>
						{/each}

						<!-- Show seen notifications -->
						<h3 class="mt-6 text-lg font-bold">Seen Notifications</h3>
						{#each allSeenNotifications as notification}
							<div class="my-3">
								<Notification {notification} />
							</div>
						{/each}

						<!-- Load more seen notifications -->
						{#if allSeenNotifications.length > 0}
							<button onclick={loadMoreSeenNotifications} class="btn mt-4"> Load More </button>
						{/if}
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
