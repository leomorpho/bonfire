<script lang="ts">
	import IndividualBringListItem from './items/IndividualBringListItem.svelte';
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
	import { Plus } from 'lucide-svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import BringListItem from './items/SharedBringListItem.svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';
	import BringListItemsSortedByUsers from './BringListItemsSortedByUsers.svelte';

	let {
		eventId,
		currUserId = null,
		tempAttendeeId = null,
		isAdmin = false,
		numAttendeesGoing = 5,
		changeToDiscussionsTab = null,
		requireGuestBringItem = false,
		isCurrenUserEventAdmin = false
	} = $props();

	if (!tempAttendeeId && !currUserId) {
		throw new Error('either temp or user id must be set for bring list');
	}

	let initialLoad = $state(true);
	let bringItems: Array<BringItem> = $state([]);
	let userItemsMap = $state({});
	let tempAttendeeItemsMap = $state({});
	let yourItems: Array<BringItem> = $state([]);

	// Function to calculate total quantity brought for each item
	function calculateTotalBrought(item: BringItem): number {
		if (!item.bring_assignments || item.bring_assignments.length === 0) {
			return 0;
		}

		return item.bring_assignments.reduce((total: number, assignment: BringAssignment) => {
			return total + assignment.quantity;
		}, 0);
	}

	// Function to calculate completion percentage
	function calculateCompletionPercentage(item: BringItem): number {
		const totalBrought = calculateTotalBrought(item);
		return item.quantity_needed ? (totalBrought / item.quantity_needed) * 100 : 0;
	}

	onMount(() => {
		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('bring_items').Where(['event_id', '=', eventId]).Include('bring_assignments'),
			(results) => {
				bringItems = results
					.map((item) => ({
						...item,
						// total_brought: calculateTotalBrought(item),
						completion_percentage: calculateCompletionPercentage(item)
					}))
					// .sort((a, b) => a.total_brought - b.total_brought); // 🔥 Sort ascending by total_brought;
					.sort((a, b) => a.completion_percentage - b.completion_percentage); // Sort ascending by completion percentage

				// Clear the maps before populating them
				userItemsMap = {};
				tempAttendeeItemsMap = {};

				// Populate the maps with items each user and temp attendee is bringing
				bringItems.forEach((item) => {
					item.bring_assignments?.forEach((assignment) => {
						const userId = assignment.assigned_to_user_id;
						const tempAttendeeId = assignment.assigned_to_temp_attendee_id;

						if (userId) {
							if (!userItemsMap[userId]) {
								userItemsMap[userId] = [];
							}

							// Check if the item is already in the map to avoid duplicates
							const existingItemIndex = userItemsMap[userId].findIndex(
								(existingItem) => existingItem.id === item.id
							);

							if (existingItemIndex === -1) {
								// Filter the bring_assignments to only include the current user's assignments
								const userSpecificItem = {
									...item,
									bring_assignments: item.bring_assignments?.filter(
										(a) => a.assigned_to_user_id === userId
									)
								};

								userItemsMap[userId].push(userSpecificItem);
							}
						}

						if (tempAttendeeId) {
							if (!tempAttendeeItemsMap[tempAttendeeId]) {
								tempAttendeeItemsMap[tempAttendeeId] = [];
							}

							// Check if the item is already in the map to avoid duplicates
							const existingItemIndex = tempAttendeeItemsMap[tempAttendeeId].findIndex(
								(existingItem) => existingItem.id === item.id
							);

							if (existingItemIndex === -1) {
								// Filter the bring_assignments to only include the current temp attendee's assignments
								const tempAttendeeSpecificItem = {
									...item,
									bring_assignments: item.bring_assignments.filter(
										(a) => a.assigned_to_temp_attendee_id === tempAttendeeId
									)
								};

								tempAttendeeItemsMap[tempAttendeeId].push(tempAttendeeSpecificItem);
							}
						}
					});
				});

				// Get the items for the current user
				yourItems = userItemsMap[currUserId] || tempAttendeeItemsMap[tempAttendeeId] || [];

				console.log('bringItems', bringItems);
				console.log('userItemsMap', userItemsMap);
				console.log('tempAttendeeItemsMap', tempAttendeeItemsMap);
				console.log('yourItems', yourItems);
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

<Tabs.Root value="all-bring-list-items" class="mt-2 w-full">
	<div class="flex w-full justify-center">
		<Tabs.List>
			<Tabs.Trigger value="all-bring-list-items">All</Tabs.Trigger>
			<Tabs.Trigger value="your-bring-list-items">Yours</Tabs.Trigger>
			<Tabs.Trigger value="all-sorted-by-attendee-bring-list-items">Everyone's</Tabs.Trigger>
			{#if isCurrenUserEventAdmin}{/if}
		</Tabs.List>
	</div>

	<Tabs.Content value="all-bring-list-items">
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
	</Tabs.Content>
	<Tabs.Content value="your-bring-list-items">
		{#if initialLoad}
			<div class="flex w-full items-center justify-center"><SvgLoader /></div>
		{:else if yourItems.length > 0}
			<div class="my-2">
				{#each yourItems as item (item.id)}
					<IndividualBringListItem
						itemName={item.name}
						itemUnit={item.unit}
						numBrought={item.bring_assignments?.[0]?.quantity ?? 0}
					/>
				{/each}
			</div>
		{:else}
			<BonfireNoInfoCard text={'You are not bringing any items yet'} />
		{/if}
	</Tabs.Content>
	<Tabs.Content value="all-sorted-by-attendee-bring-list-items">
		<BringListItemsSortedByUsers {userItemsMap} {tempAttendeeItemsMap} />
	</Tabs.Content>
</Tabs.Root>

<div class="mt-2 flex w-full justify-center">
	<button
		onclick={changeToDiscussionsTab}
		class="mb-2 w-fit rounded-xl bg-blue-400/80 p-2 text-sm hover:bg-blue-300/80 hover:bg-opacity-40 dark:bg-blue-700/50 dark:hover:bg-blue-600/50"
	>
		Have a suggestion? Click here to share it in the bonfire's discussion!
	</button>
</div>

{#if currUserId}
	<CrudItem {eventId} {numAttendeesGoing} class={'w-full'} {isAdmin}>
		<Button
			id="add-bring-list-item-btn"
			class=" flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
		>
			<Plus class="mr-1" />
			{#if isAdmin}
				New item
			{:else if currUserId || tempAttendeeId}
				Bring something
			{/if}
		</Button>
	</CrudItem>
{/if}
