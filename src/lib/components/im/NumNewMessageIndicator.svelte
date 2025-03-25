<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, TriplitClient } from '@triplit/client';
	import { NotificationType } from '$lib/enums';

	let { children } = $props();

	let userId = $state('');
	let notificationsCount = $state(0);

	const createNotificationsQuery = (client: TriplitClient, userId: string) => {
		return client
			.query('notifications')
			.Where(
				and([
					['user_id', '=', userId],
					['seen_at', '=', null],
					['object_type', '=', NotificationType.NEW_MESSAGE]
				])
			)
			.Select(['id'])
			.Order('created_at', 'DESC');
	};

	onMount(() => {
		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const init = async () => {
			userId = (await waitForUserId()) as string;

			let notificationsQuery = createNotificationsQuery(client, userId);

			const unsubscribe = client.subscribe(
				notificationsQuery,
				(results) => {
					notificationsCount = results.length;
				},
				(error) => {
					console.error('Error fetching new message count:', error);
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

<div class="relative flex items-center">
	<!-- Name -->
	{@render children?.()}

	<!-- Notification Badge -->
	{#if notificationsCount > 0}
		<div
			class="absolute -right-7 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white sm:h-5 sm:w-5 sm:text-sm"
		>
			{#if notificationsCount <= 10}
				{notificationsCount}
			{:else}
				<span class="sr-only">{notificationsCount}</span>
			{/if}
		</div>
	{/if}
</div>