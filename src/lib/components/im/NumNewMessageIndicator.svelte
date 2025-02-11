<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';

	onMount(() => {
		const client = getFeTriplitClient($page.data.jwt);

		let threadMessagesQuery = client.query('event_messages');

		if (threadId) {
			threadMessagesQuery = threadMessagesQuery.where([['thread_id', '=', threadId]]);
		} else {
			threadMessagesQuery = threadMessagesQuery.where([['thread.name', '=', MAIN_THREAD]]);
		}

		if (maxNumMessages) {
			threadMessagesQuery = threadMessagesQuery.limit(maxNumMessages);
		}

		threadMessagesQuery = threadMessagesQuery
			.include('user')
			.include('seen_by')
			.order('created_at', 'DESC')
			.build();
	});
</script>
