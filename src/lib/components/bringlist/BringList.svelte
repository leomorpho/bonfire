<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import CrudItem from './CrudItem.svelte';
	import type { BringAssignment, BringItem } from '$lib/types';
	import BringItemProgressBar from './BringItemProgressBar.svelte';

	let { eventId, currUserId, isAdmin = false, numAttendeesGoing = 5 } = $props();
	let initialLoad = $state(true);
	let bringItems: Array<BringItem> = $state([]);

	// Function to calculate total quantity brought for each item
	function calculateTotalBrought(item: BringItem): number {
		if (!item.bring_assignments || item.bring_assignments.length === 0) {
			return 0;
		}

		return item.bring_assignments.reduce((total: number, assignment: BringAssignment) => {
			return total + assignment.quantity;
		}, 0);
	}

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('bring_items')
				.where(['event_id', '=', eventId])
				.include('bring_assignments')
				.build(),
			(results, info) => {
				bringItems = results.map((item) => ({
					...item,
					total_brought: calculateTotalBrought(item)
				}));
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

<div class="my-2">
	{#if initialLoad}
		<div class="flex w-full items-center justify-center"><SvgLoader /></div>
	{:else}
		{#each bringItems as item}
			<BringItemProgressBar {item} {currUserId} />
		{/each}
	{/if}
</div>
{#if isAdmin}
	<CrudItem {eventId} {numAttendeesGoing} />
{/if}
