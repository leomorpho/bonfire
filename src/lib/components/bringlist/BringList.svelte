<script lang="ts">
	import { onMount } from 'svelte';

	let { eventId } = $props();
	let initialLoad = $state(true);
	let bringItems = $state([]);

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('bring_items').where(['event_id', '=', eventId]).build(),
			(results, info) => {
				bringItems = results;
			},
			(error) => {
				// handle error
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					initialLoad = false;
				}
			}
		);

		return () => {
			unsubscribe;
		};
	});
</script>
