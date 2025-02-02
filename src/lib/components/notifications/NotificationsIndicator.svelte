<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import Notifications from './Notifications.svelte';
	import { Bell } from 'lucide-svelte';

	let userId = $state('');
	let notificationsCount = $state(0);

	const createNotificationsQuery = (client: TriplitClient, userId: string) => {
		return client
			.query('notifications')
			.where([
				['user_id', '=', userId],
				['seen_at', '=', null]
			])
			.select(['id'])
			.order('created_at', 'DESC');
	};

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		console.log('loading notifications in NotificationsLoader');
		const init = async () => {
			userId = (await waitForUserId()) as string;

			let notificationsQuery = createNotificationsQuery(client, userId);

			const unsubscribe = client.subscribe(
				notificationsQuery.build(),
				(results, info) => {
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
				unsubscribe();
			};
		};

		init();
	});
</script>

<Notifications>
	<div class="relative">
		<!-- Notification Button -->
		<div
			class="m-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
		>
			<Bell class="h-6 w-6 sm:h-5 sm:w-5" />
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
