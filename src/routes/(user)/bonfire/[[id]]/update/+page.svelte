<script lang="ts">
	import EventForm from '$lib/components/EventForm.svelte';
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import { feTriplitClient } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';

	let data;
	let client = feTriplitClient as TriplitClient;

	onMount(() => {
		data = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));
	});
</script>

{#if !data || data.fetching}
	<Loader />
{:else if data.error}
	<p>Error: {data.error.message}</p>
{:else if data.results}
	<EventForm mode={'update'} event={data.results[0]} />
{/if}
