<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { BringListCountTypes } from '$lib/enums';
	import { Cog, Tally5, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BringListItem from './items/BringListItem.svelte';
	import CrudItem from './CrudItem.svelte';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { assignBringItem, updateBringAssignment } from '$lib/bringlist';
	import { toast } from 'svelte-sonner';

	let { item, currUserId, isAdmin, eventId, numAttendeesGoing } = $props();

	// Find the current user's assignment (if any)
	let userAssignment = item.bring_assignments?.find(
		(assignment) => assignment.assigned_to === currUserId
	);

	let numBroughtByOthers = $state(
		item.bring_assignments?.reduce((total, assignment) => {
			return assignment.assigned_to !== currUserId ? total + assignment.quantity : total;
		}, 0) || 0
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

	// If the user has an assignment, use that quantity, otherwise default to max needed
	let numCommittedByuser = $state(
		userAssignment ? userAssignment.quantity : item.quantity_needed - item.total_brought
	);

	let tempUserCommitment = $state(numCommittedByuser); // Temp state for the slider in the dialog

	let isOpen = $state(false);

	const upsertAssignment = async (closeAfterSave = false, showToasts = false) => {
		const client = getFeTriplitClient($page.data.jwt);
		if (userAssignment) {
			try {
				await updateBringAssignment(client, userAssignment.id, { quantity: tempUserCommitment });
				if (showToasts) {
					toast.success("Successfully updated the number you're bringing");
				}
				userIdToNumBrought = {
					...userIdToNumBrought,
					[currUserId]: tempUserCommitment
				};
			} catch (e) {
				console.error('failed to update bring assignment', e);
			}
		} else {
			try {
				await assignBringItem(client, item.id, currUserId, currUserId, tempUserCommitment);
				if (showToasts) {
					toast.success("Successfully set the number you're bringing");
				}
				userIdToNumBrought = {
					...userIdToNumBrought,
					[currUserId]: tempUserCommitment
				};
			} catch (e) {
				console.error('failed to assign bring assignment', e);
			}
		}

		if (closeAfterSave) {
			isOpen = false;
		}
	};
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class="mt-2 w-full">
		<button class="w-full">
			<BringListItem
				itemName={item.name}
				itemUnit={item.unit}
				itemQuantityNeeded={item.quantity_needed}
				{userIdToNumBrought}
			/>
		</button>
	</Dialog.Trigger>
	<Dialog.Content class="rounded-xl">
		<Dialog.Header class="mt-3">
			{#if isAdmin}
				<div class="flex w-full justify-center">
					<CrudItem {eventId} {numAttendeesGoing} {item}>
						<Button
							variant="outline"
							class="m-2 rounded-full focus:outline-none focus-visible:ring-0"
						>
							<Cog class="h-5 w-5" />
						</Button>
					</CrudItem>
				</div>
			{/if}
			<Dialog.Description>Set the amount you're bringing.</Dialog.Description>
			<BringListItem
				itemName={item.name}
				itemUnit={item.unit}
				itemQuantityNeeded={item.quantity_needed}
				userIdToNumBrought={{
					...userIdToNumBrought,
					[currUserId]: tempUserCommitment // Use temp state inside the dialog
				}}
			/>
		</Dialog.Header>
		<!-- Slider to adjust the user's contribution -->
		<div class="mt-4 flex flex-col items-center gap-2">
			<input
				type="range"
				min="0"
				max={item.quantity_needed - numBroughtByOthers}
				bind:value={tempUserCommitment}
				class="w-full cursor-pointer"
			/>
			<span class="flex items-center">
				{#if item.unit == BringListCountTypes.PER_PERSON}
					<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing enough for {tempUserCommitment}
					people
				{:else if item.unit == BringListCountTypes.COUNT}
					<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing {tempUserCommitment} of this
				{/if}
			</span>
		</div>
		<Dialog.Footer>
			<Button
				type="submit"
				class="w-full"
				onclick={() => {
					upsertAssignment(true, true);
				}}>Submit</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
