<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';

	let { bonfireId } = $props();

	onMount(() => {
		const client = getFeTriplitClient($page.data.jwt);

		let threadMessagesQuery = client
			.query('event_messages')
			.where([['thread.event_id', '=', bonfireId]]).where();


		threadMessagesQuery = threadMessagesQuery
			.include('user')
			.include('seen_by')
			.order('created_at', 'DESC')
			.build();
	});
</script>
