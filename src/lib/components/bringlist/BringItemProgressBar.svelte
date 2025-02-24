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

	const isTempUser = !currUserId;

	/** Helper function to generate a unique key for both permanent and temporary users */
	const getUserKey = (userId: string, isTemp: boolean) =>
		isTemp ? `temp_${userId}` : `user_${userId}`;

	/** Helper function to extract the original ID from a key for DB interactions */
	const extractUserId = (userKey: string) => userKey.replace(/^user_|^temp_/, '');

	// Find the current user's assignment (checking both user types)
	let userAssignment = item.bring_assignments?.find(
		(assignment: any) =>
			(isTempUser && assignment.assigned_to_temp_attendee_id === currUserId) ||
			(!isTempUser && assignment.assigned_to_user_id === currUserId)
	);

	// Calculate items brought by others
	let numBroughtByOthers = $state(
		item.bring_assignments?.reduce((total, assignment) => {
			const isOtherUser =
				(isTempUser && assignment.assigned_to_temp_attendee_id !== currUserId) ||
				(!isTempUser && assignment.assigned_to_user_id !== currUserId);
			return isOtherUser ? total + assignment.quantity : total;
		}, 0) || 0
	);

	// Create userIdToNumBrought to support both user types
	let userIdToNumBrought = $derived(
		item.bring_assignments?.reduce(
			(acc, assignment) => {
				if (assignment.assigned_to_user_id) {
					acc[getUserKey(assignment.assigned_to_user_id, false)] =
						(acc[getUserKey(assignment.assigned_to_user_id, false)] || 0) + assignment.quantity;
				}
				if (assignment.assigned_to_temp_attendee_id) {
					acc[getUserKey(assignment.assigned_to_temp_attendee_id, true)] =
						(acc[getUserKey(assignment.assigned_to_temp_attendee_id, true)] || 0) +
						assignment.quantity;
				}
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
		const userKey = getUserKey(currUserId, isTempUser);
		const extractedUserId = extractUserId(userKey);

		// Determine correct assignment fields
		const assignedToUserId = isTempUser ? null : extractedUserId;
		const assignedToTempUserId = isTempUser ? extractedUserId : null;

		if (userAssignment) {
			try {
				await updateBringAssignment(client, userAssignment.id, { quantity: tempUserCommitment });
				if (showToasts) {
					toast.success("Successfully updated the number you're bringing");
				}
				// userIdToNumBrought = {
				// 	...userIdToNumBrought,
				// 	[userKey]: tempUserCommitment
				// };
			} catch (e) {
				console.error('failed to update bring assignment', e);
			}
		} else {
			try {
				await assignBringItem(
					client,
					item.id,
					assignedToUserId,
					assignedToTempUserId,
					assignedToUserId,
					tempUserCommitment
				);
				if (showToasts) {
					toast.success("Successfully set the number you're bringing");
				}
				// userIdToNumBrought = {
				// 	...userIdToNumBrought,
				// 	[userKey]: tempUserCommitment
				// };
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
