<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import CrudItem from './CrudItem.svelte';
	import type { BringAssignment, BringItem } from '$lib/types';
	import BringItemProgressBar from './BringItemProgressBar.svelte';
	import { Button } from '../ui/button';
	import BonfireNoInfoCard from '../BonfireNoInfoCard.svelte';

	let {
		eventId,
		currUserId = null,
		tempAttendeeId = null,
		isAdmin = false,
		numAttendeesGoing = 5
	} = $props();

	if (!tempAttendeeId && !currUserId) {
		throw new Error('either temp or user id must be set for bring list');
	}

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
	{:else if bringItems.length > 0}
		<div class="my-2">
			{#each bringItems as item (item.id)}
				<BringItemProgressBar
					{eventId}
					{item}
					{numAttendeesGoing}
					currUserId={currUserId ? currUserId : tempAttendeeId}
					isTempUser={!currUserId}
					{isAdmin}
				/>
			{/each}
		</div>
	{:else}
		<BonfireNoInfoCard text={'No items to bring yet'} />
	{/if}
</div>
{#if isAdmin}
	<CrudItem {eventId} {numAttendeesGoing} cls={'w-full'}>
		<Button
			class="flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
			>Add</Button
		>
	</CrudItem>
{/if}
