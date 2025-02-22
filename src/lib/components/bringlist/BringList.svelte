<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import CrudItem from './CrudItem.svelte';

	let { eventId, isAdmin = false, numAttendeesGoing = 5 } = $props();
	let initialLoad = $state(true);
	let bringItems = $state([]);

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('bring_items').where(['event_id', '=', eventId]).build(),
			(results, info) => {
				bringItems = results;
				initialLoad = false;
			},
			(error) => {
				// handle error
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribe;
		};
	});
</script>

<div class="rounded-xl bg-white p-5 dark:bg-slate-900">
	<div class="font-semibold">Bring List</div>
</div>

{#if initialLoad}
	<div class="flex w-full items-center justify-center"><SvgLoader /></div>
{:else}
	{#each bringItems as item}
		<div>{item}</div>
	{/each}
{/if}
{#if isAdmin}
	<CrudItem {eventId} {numAttendeesGoing} />
{/if}
