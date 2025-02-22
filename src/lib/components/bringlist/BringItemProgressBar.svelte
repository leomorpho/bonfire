<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { BringListCountTypes } from '$lib/enums';
	import { Tally5, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BringListItem from './BringListItem.svelte';
	import { onMount } from 'svelte';

	let { item, currUserId } = $props();

	// Find the current user's assignment (if any)
	let userAssignment = item.bring_assignments?.find(
		(assignment) => assignment.assigned_to === currUserId
	);

	let userIdToNumBrought = $state(
		item.bring_assignments?.reduce(
			(acc, assignment) => {
				acc[assignment.assigned_to] = (acc[assignment.assigned_to] || 0) + assignment.quantity;
				return acc;
			},
			{} as Record<string, number>
		) || {}
	);

	let userIdToNumBroughtCopy = { ...userIdToNumBrought };

	// If the user has an assignment, use that quantity, otherwise default to max needed
	let numCommittedByuser = $state(
		userAssignment ? userAssignment.quantity : item.quantity_needed - item.total_brought
	);

	let isOpen = $state(false);

	const updateUserIdToNumBrought = () => {
		userIdToNumBrought = {
			...userIdToNumBrought,
			[currUserId]: numCommittedByuser
		};
	};

	onMount(() => {
		updateUserIdToNumBrought();
	});
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class="mt-2 w-full">
		<button class="w-full">
			<BringListItem
				itemName={item.name}
				itemUnit={item.unit}
				itemQuantityNeeded={item.quantity_needed}
				userIdToNumBrought={userIdToNumBroughtCopy}
			/>
		</button>
	</Dialog.Trigger>
	<Dialog.Content class="rounded-xl">
		<Dialog.Header class="mt-3">
			<Dialog.Description>Set the amount you're bringing.</Dialog.Description>
			<BringListItem
				itemName={item.name}
				itemUnit={item.unit}
				itemQuantityNeeded={item.quantity_needed}
				{userIdToNumBrought}
			/>
		</Dialog.Header>
		<!-- Slider to adjust the user's contribution -->
		<div class="mt-4 flex flex-col items-center gap-2">
			<input
				type="range"
				min="0"
				max={item.quantity_needed - item.total_brought}
				bind:value={numCommittedByuser}
				class="w-full cursor-pointer"
				oninput={updateUserIdToNumBrought}
			/>
			<span class="flex items-center">
				{#if item.unit == BringListCountTypes.PER_PERSON}
					<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing enough for {numCommittedByuser}
					people
				{:else if item.unit == BringListCountTypes.COUNT}
					<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing {numCommittedByuser} of this
				{/if}
			</span>
		</div>
		<Dialog.Footer>
			<Button type="submit" class="w-full">Submit</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
