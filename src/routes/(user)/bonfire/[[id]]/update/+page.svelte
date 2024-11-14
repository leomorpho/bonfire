<script lang="ts">
	import EventForm from '$lib/components/EventForm.svelte';
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { schema } from '../../../../../../triplit/schema';
	import { PUBLIC_TRIPLIT_TOKEN, PUBLIC_TRIPLIT_URL } from '$env/static/public';
	import { onMount } from 'svelte';

	let data;
	onMount(() => {
		const client = new TriplitClient({
			storage: 'indexeddb',
			schema,
			serverUrl: PUBLIC_TRIPLIT_URL,
			token: PUBLIC_TRIPLIT_TOKEN
		});

		data = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));
	});
</script>

{#if !data || data.fetching}
	<p>Loading...</p>
{:else if data.error}
	<p>Error: {data.error.message}</p>
{:else if data.results}
	<EventForm mode={'update'} event={data.results[0]} />
{/if}
