<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import Notifications from './Notifications.svelte';
	import { Bell } from 'lucide-svelte';

	let userId = $state('');
	let notificationsCount = $state(0);

	const createNotificationsQuery = (client: TriplitClient, userId: string) => {
		return client
			.query('notifications')
			.Where([
				['user_id', '=', userId],
				['seen_at', '=', null]
			])
			.Select(['id', 'object_type', 'object_ids'])
			.Order('created_at', 'DESC');
	};

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('loading notifications in NotificationsLoader');
		const init = async () => {
			userId = (await waitForUserId()) as string;

			const notificationsQuery = createNotificationsQuery(client, userId);

			const unsubscribeFromNotificationsQuery = client.subscribe(
				notificationsQuery,
				(results) => {
					notificationsCount = results.length;
					console.log('NotificationsIndication new count:', notificationsCount);
				},
				(error) => {
					console.error('Error fetching announcements:', error);
				},
				// Optional
				{
					localOnly: false,
					onRemoteFulfilled: () => {
						// console.log('Server has sent back results for the subscription');
					}
				}
			);

			return () => {
				unsubscribeFromNotificationsQuery();
			};
		};

		init();
	});
</script>

<Notifications>
	<div class="relative">
		<!-- Notification Button -->
		<div
			class="m-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
		>
			<Bell class="h-5 w-5" />
		</div>

		<!-- Notification Badge -->
		{#if notificationsCount > 0}
			<div
				class="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white sm:h-5 sm:w-5 sm:text-sm"
			>
				{#if notificationsCount <= 5}
					{notificationsCount}
				{:else}
					<span class="sr-only"></span>
				{/if}
			</div>
		{/if}
	</div>
</Notifications>
