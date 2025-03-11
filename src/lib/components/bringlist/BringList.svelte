<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../SvgLoader.svelte';
	import CrudItem from './CrudItem.svelte';
	import type { BringAssignment, BringItem } from '$lib/types';
	import BringItemProgressBar from './BringItemProgressBar.svelte';
	import { Button } from '../ui/button';
	import BonfireNoInfoCard from '../BonfireNoInfoCard.svelte';
	import { Plus, ShoppingBasket } from 'lucide-svelte';

	let {
		eventId,
		currUserId = null,
		tempAttendeeId = null,
		isAdmin = false,
		numAttendeesGoing = 5,
		changeToDiscussionsTab = null
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
		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('bring_items')
				.Where(['event_id', '=', eventId])
				.Include('bring_assignments')
				,
			(results, info) => {
				bringItems = results
					.map((item) => ({
						...item,
						total_brought: calculateTotalBrought(item)
					}))
					.sort((a, b) => a.total_brought - b.total_brought); // 🔥 Sort ascending by total_brought;
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
<div class="flex w-full justify-center">
	<button
		onclick={changeToDiscussionsTab}
		class="mb-2 w-fit rounded-xl bg-blue-200 bg-opacity-40 p-2 text-sm hover:bg-blue-300 hover:bg-opacity-40 dark:bg-blue-700 dark:bg-opacity-40 dark:hover:bg-blue-600 dark:hover:bg-opacity-40"
	>
		Have a suggestion? Click here to share it in the bonfire's discussion!
	</button>
</div>

{#if isAdmin}
	<CrudItem {eventId} {numAttendeesGoing} cls={'w-full'}>
		<Button
			id="add-bring-list-item-btn"
			class="flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
		>
			<Plus class="mr-1" />
			New item</Button
		>
	</CrudItem>
{/if}
