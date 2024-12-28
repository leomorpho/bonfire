<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import { updateAnnouncementsStore } from '$lib/stores';

	let userId = $state('');
	const eventId = $page.params.id;

	const createAnnouncementsQuery = (client: TriplitClient) => {
		return client
			.query('announcement')
			.where(['event_id', '=', eventId])
			.order('created_at', 'DESC');
	};

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const init = async () => {
			userId = (await waitForUserId()) as string;

			let announcementsQuery = createAnnouncementsQuery(client);

			const unsubscribe = client.subscribe(
				announcementsQuery.build(),
				(results, info) => {
					console.log('Current notifications :', results);
					updateAnnouncementsStore((state) => {
						state.announcementsSubset = results;
						state.announcementsLoading = false;
						return state;
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
