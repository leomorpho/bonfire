<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import { updateNotificationsQuery } from '$lib/stores';

	let userId = $state('');

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
					updateNotificationsQuery({
						allUnreadNotifications: results,
						notificationsLoading: false,
						totalCount: results.length
					});
				},
				(error) => {
					console.error('Error fetching announcements:', error);
				},
				// Optional
				{
					localOnly: false,
					onRemoteFulfilled: () => {
						console.log('Server has sent back results for the subscription');
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

<!-- This component doesn't render anything -->
