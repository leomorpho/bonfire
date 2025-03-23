<script lang="ts">
	import Notification from './Notification.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { and } from '@triplit/client';

	let { children } = $props(); // Allow custom button text or children
	let isDialogOpen = $state(false); // Dialog open state

	let userId = $state('');

	// Read notifications and loading state from the store
	let allUnreadNotifications: any = $state([]);
	let allSeenNotifications: any = $state([]);

	// Track pagination for seen notifications
	let loadMoreSeen: ((pageSize?: number) => void) | undefined = $state();
	let lastNumSeenLoaded = $state(0);

	// TODO: properly do paged loading, right now it is not 
	// working because i just set a crazy high number to prevent it from working.
	const NUM_TO_LOAD = 2000;

	// Initialize the seen notifications subscription
	async function initLoadNotifications() {
		const client = getFeWorkerTriplitClient($page.data.jwt);
		const unseenQuery = client
			.query('notifications')
			.Where([
				['user_id', '=', userId],
				['seen_at', '=', null]
			])
			.Order('created_at', 'DESC')
			;

		allUnreadNotifications = await client.fetch(unseenQuery);

		const seenQuery = client
			.query('notifications')
			.Where([
				['user_id', '=', userId],
				and([
					['seen_at', '!=', null],
					['seen_at', '<', new Date()]
				])
			])
			.Order('created_at', 'DESC')
			.limit(NUM_TO_LOAD); // Initial limit

		const { unsubscribe, loadMore } = client.subscribeWithExpand(
			seenQuery,
			(results) => {
				console.log('Loaded more seen notifications', results);

				// Avoid duplicates by checking IDs
				const existingIds = new Set(allSeenNotifications.map((notif) => notif.id));
				const uniqueResults = results.filter((notif) => !existingIds.has(notif.id));

				lastNumSeenLoaded = uniqueResults.length;

				// Update with unique notifications only and sort by created_at
				allSeenNotifications = [...allSeenNotifications, ...uniqueResults].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				) as [];
				loadMoreSeen = loadMore; // Save the loadMore function for pagination
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
			initLoadNotifications();
		}
	});

	function toggleDialog() {
		isDialogOpen = !isDialogOpen;
	}

	// TODO: Not sure that actually works
	function loadMoreSeenNotifications() {
		if (loadMoreSeen) {
			loadMoreSeen(10); // Load the next 10 notifications
		}
	}
</script>

<!-- Notifications Icon/Button -->
<button onclick={toggleDialog} aria-label="Notifications">
	{@render children?.()}
</button>

<!-- Notifications Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Content class="flex h-full items-center justify-center sm:h-[90vh]">
		<ScrollArea class="flex h-full items-center justify-center sm:h-[90vh]">
			<Dialog.Header class="mx-4 my-8">
				<Dialog.Title class="w-full flex justify-center">Your Notifications</Dialog.Title>
				<Dialog.Description>
					{#if allUnreadNotifications.length == 0 && allSeenNotifications.length == 0}
						<div class="my-5 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 dark:text-white p-3">
							No notifications
						</div>
					{/if}
					{#if allUnreadNotifications.length > 0}
						<!-- Show unread notifications -->
						<h3 class="text font-bold">Unread</h3>
						{#each allUnreadNotifications as notification}
							<div class="my-3">
								<Notification {notification} {toggleDialog} />
							</div>
						{/each}
					{/if}

					{#if allSeenNotifications.length > 0}
						<!-- Show seen notifications -->
						<h3 class="text mt-6 font-bold">Seen</h3>
						{#each allSeenNotifications as notification}
							<div class="my-3">
								<Notification {notification} {toggleDialog} />
							</div>
						{/each}

						<!-- Load more seen notifications, TODO: set up an intersection observer -->
						{#if loadMoreSeen && lastNumSeenLoaded > NUM_TO_LOAD}
							<div class="flex w-full justify-center">
								<button onclick={loadMoreSeenNotifications} class="btn mt-4"> Load More </button>
							</div>
						{/if}
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>
