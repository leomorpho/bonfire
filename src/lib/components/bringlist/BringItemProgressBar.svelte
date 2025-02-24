<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { BringListCountTypes } from '$lib/enums';
	import { Cog, Tally5, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BringListItem from './items/BringListItem.svelte';
	import CrudItem from './CrudItem.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { assignBringItem, deleteBringAssignment, updateBringAssignment } from '$lib/bringlist';
	import { toast } from 'svelte-sonner';
	import ProfileAvatar from '../ProfileAvatar.svelte';

	let { item, currUserId, isTempUser, isAdmin, eventId, numAttendeesGoing } = $props();

	/** Helper function to generate a unique key for both permanent and temporary users */
	const getUserKey = (userId: string, isTemp: boolean) =>
		isTemp ? `temp_${userId}` : `user_${userId}`;

	/** Helper function to extract the original ID from a key for DB interactions */
	const extractUserId = (userKey: string) => userKey.replace(/^user_|^temp_/, '');

	/**
	 * Determines if a given user key belongs to a temporary user.
	 * @param {string} userKey - The user key to check (e.g., "temp_123", "user_456").
	 * @returns {boolean} - True if the user is a temporary user, otherwise false.
	 */
	const isTempUserKey = (userKey: string): boolean => userKey.startsWith('temp_');

	let userAssignment = $state();
	let numBroughtByOthers = $state(0);
	let numCommittedByuser = $state(0);
	let tempUserCommitment = $state(0); // Temp state for the slider in the dialog
	let isOpen = $state(false);
	let userIdToNumBroughtWhenDialogOpen: any = $state({});
	let userCanSetBringAmount = $derived(
		item.quantity_needed - numBroughtByOthers > 0 || tempUserCommitment != 0
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

	$effect(() => {
		if (isOpen) {
			userIdToNumBroughtWhenDialogOpen = userIdToNumBrought;

			// Find the current user's assignment (checking both user types)
			userAssignment = item.bring_assignments?.find(
				(assignment: any) =>
					(isTempUser && assignment.assigned_to_temp_attendee_id === currUserId) ||
					(!isTempUser && assignment.assigned_to_user_id === currUserId)
			);

			// Calculate items brought by others
			numBroughtByOthers =
				item.bring_assignments?.reduce((total, assignment) => {
					const isOtherUser =
						(isTempUser && assignment.assigned_to_temp_attendee_id !== currUserId) ||
						(!isTempUser && assignment.assigned_to_user_id !== currUserId);
					return isOtherUser ? total + assignment.quantity : total;
				}, 0) || 0;

			// If the user has an assignment, use that quantity, otherwise default to max needed
			numCommittedByuser = userAssignment ? userAssignment.quantity : 0;
			tempUserCommitment = numCommittedByuser; // Temp state for the slider in the dialog
		}
	});

	$effect(() => {
		userIdToNumBroughtWhenDialogOpen[getUserKey(currUserId, isTempUser)] = tempUserCommitment;
	});

	// $effect(() => {
	// 	console.log('---------------------------');
	// 	console.log('item.name', item.name);
	// 	console.log('userAssignment', userAssignment);
	// 	console.log('item.bring_assignments', item.bring_assignments);
	// 	console.log('numCommittedByuser', numCommittedByuser);
	// 	console.log('numBroughtByOthers', numBroughtByOthers);
	// 	console.log('userIdToNumBrought', userIdToNumBrought);
	// 	console.log('tempUserCommitment', tempUserCommitment);
	// });

	const upsertAssignment = async (closeAfterSave = false, showToasts = false) => {
		const client = getFeWorkerTriplitClient($page.data.jwt);
		const userKey = getUserKey(currUserId, isTempUser);
		const extractedUserId = extractUserId(userKey);

		// Determine correct assignment fields
		const assignedToUserId = isTempUser ? null : extractedUserId;
		const assignedToTempUserId = isTempUser ? extractedUserId : null;

		console.log('assignedToUserId', assignedToUserId, 'assignedToTempUserId', assignedToTempUserId);
		if (userAssignment) {
			try {
				if (tempUserCommitment == 0) {
					await deleteBringAssignment(client, userAssignment.id);
					if (showToasts) {
						toast.success(`You're now bringing no "${item.name}""`);
					}
				} else {
					await updateBringAssignment(client, userAssignment.id, { quantity: tempUserCommitment });
					if (showToasts) {
						toast.success(`You're now bringing ${tempUserCommitment} "${item.name}""`);
					}
				}
			} catch (e) {
				console.error('failed to update bring assignment', e);
			}
		} else {
			try {
				await assignBringItem(
					client,
					item.id,
					isTempUser ? null : assignedToUserId,
					isTempUser ? assignedToTempUserId : null,
					assignedToUserId,
					tempUserCommitment
				);
				if (showToasts) {
					toast.success(`You're now bringing ${tempUserCommitment} "${item.name}""`);
				}
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
				userIdToNumBrought={userIdToNumBroughtWhenDialogOpen}
			/>
			<div class="p-2">{item.details}</div>
		</Dialog.Header>
		<div>
			{#each Object.entries(userIdToNumBroughtWhenDialogOpen).sort(([, aQuantity], [, bQuantity]) => bQuantity - aQuantity) as [userKey, quantity]}
				{#if quantity > 0}
					<div class="my-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
						<div class="flex items-center justify-around py-1">
							<ProfileAvatar
								userId={isTempUserKey(userKey) ? null : extractUserId(userKey)}
								tempUserId={isTempUserKey(userKey) ? extractUserId(userKey) : null}
								baseHeightPx={40}
							/><span>bringing {quantity}</span>
						</div>
					</div>
				{/if}
			{/each}
		</div>
		<!-- Slider to adjust the user's contribution -->
		<div class="mt-4 flex flex-col items-center gap-2">
			{#if userCanSetBringAmount}
				<input
					type="range"
					min="0"
					max={item.quantity_needed - numBroughtByOthers}
					bind:value={tempUserCommitment}
					class="w-full cursor-pointer"
					disabled={item.quantity_needed - numBroughtByOthers == 0}
				/>
				<span class="flex items-center">
					{#if item.unit == BringListCountTypes.PER_PERSON}
						<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing enough for {tempUserCommitment}
						{tempUserCommitment > 1 ? 'people' : 'person'}
					{:else if item.unit == BringListCountTypes.COUNT}
						<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing {tempUserCommitment} of this
					{/if}
				</span>
			{:else}
				Goal reached for this item
			{/if}
		</div>
		{#if userCanSetBringAmount}
			<Dialog.Footer>
				<Button
					type="submit"
					class="w-full"
					onclick={() => {
						upsertAssignment(true, true);
					}}>Submit</Button
				>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
