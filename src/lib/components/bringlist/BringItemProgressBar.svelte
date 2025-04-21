<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { BringListCountTypes } from '$lib/enums';
	import { Cog, Tally5, UserRound } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import BringListItem from './items/SharedBringListItem.svelte';
	import CrudItem from './CrudItem.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { assignBringItem, deleteBringAssignment, updateBringAssignment } from '$lib/bringlist';
	import { toast } from 'svelte-sonner';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { fade, slide } from 'svelte/transition';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

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
	let progress = new Tween(0, {
		duration: 200,
		easing: cubicOut
	});

	let isOpen = $state(false);
	let userIdToNumBroughtWhenDialogOpen: any = $state({});
	let userCanSetBringAmount = $derived(
		item.quantity_needed - numBroughtByOthers > 0 || progress.current != 0
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
			progress.target = numCommittedByuser; // Temp state for the slider in the dialog
		}
	});

	$effect(() => {
		userIdToNumBroughtWhenDialogOpen[getUserKey(currUserId, isTempUser)] = progress.current;
	});

	const upsertAssignment = async (closeAfterSave = false, showToasts = false) => {
		const client = getFeWorkerTriplitClient($page.data.jwt);
		const userKey = getUserKey(currUserId, isTempUser);
		const extractedUserId = extractUserId(userKey);

		// Determine correct assignment fields
		const assignedToUserId = isTempUser ? null : extractedUserId;
		const assignedToTempUserId = isTempUser ? extractedUserId : null;

		const tempUserCommitment = Math.round(progress.current);

		console.log('assignedToUserId', assignedToUserId, 'assignedToTempUserId', assignedToTempUserId);
		if (userAssignment) {
			try {
				if (tempUserCommitment == 0) {
					await deleteBringAssignment(client, userAssignment.id);
					if (showToasts) {
						toast.success(`You're now bringing no "${item.name}"`);
					}
				} else {
					const preSaveTempUserCommitment = tempUserCommitment;

					await updateBringAssignment(client, userAssignment.id, { quantity: tempUserCommitment });
					if (showToasts) {
						toast.success(`You're now bringing ${preSaveTempUserCommitment} "${item.name}"`);
					}
				}
			} catch (e) {
				console.error('failed to update bring assignment', e);
			}
		} else {
			if (tempUserCommitment == 0) {
				isOpen = false;
				return;
			}
			try {
				const preSaveTempUserCommitment = tempUserCommitment;
				await assignBringItem(
					client,
					item.id,
					isTempUser ? null : assignedToUserId,
					isTempUser ? assignedToTempUserId : null,
					assignedToUserId,
					tempUserCommitment
				);
				if (showToasts) {
					toast.success(`You're now bringing ${preSaveTempUserCommitment} "${item.name}"`);
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
	<Dialog.Trigger class="bring-list-item-btn mt-2 w-full">
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
		<ScrollArea class="w-full">
			<Dialog.Header class="mt-3">
				{#if isAdmin || (item.created_by_user_id == currUserId && !isTempUser)}
					<div id="edit-bring-list-item" class="flex w-full justify-center">
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
				<Dialog.Description class="flex w-full justify-center"
					>Set the amount you're bringing.</Dialog.Description
				>
				<div class="p-2">
					<BringListItem
						itemName={item.name}
						itemUnit={item.unit}
						itemQuantityNeeded={item.quantity_needed}
						userIdToNumBrought={userIdToNumBroughtWhenDialogOpen}
					/>
				</div>

				<div class="p-2">{item.details}</div>
			</Dialog.Header>

			<!-- Slider to adjust the user's contribution -->
			<div class="my-4 flex flex-col items-center gap-2 px-1">
				{#if userCanSetBringAmount}
					<input
						type="range"
						min="0"
						max={item.quantity_needed - numBroughtByOthers}
						bind:value={progress.target}
						class="w-full cursor-pointer"
						disabled={item.quantity_needed - numBroughtByOthers == 0}
					/>
					<span class="flex items-center">
						{#if item.unit == BringListCountTypes.PER_PERSON}
							<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing enough for {Math.round(
								progress.current
							)}
							{progress.current > 1 ? 'people' : 'person'}
						{:else if item.unit == BringListCountTypes.COUNT}
							<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> You're bringing {Math.round(
								progress.current
							)} of this
						{/if}
					</span>
				{:else}
					Goal reached for this item
				{/if}
			</div>
			<div class="my-8">
				{#each Object.entries(userIdToNumBroughtWhenDialogOpen).sort(([, aQuantity], [, bQuantity]) => bQuantity - aQuantity) as [userKey, quantity]}
					{#if quantity > 0}
						<div
							class="my-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900"
							in:fade={{ duration: 300 }}
							out:fade={{ duration: 100 }}
						>
							<div
								class="flex items-center justify-around py-1"
								in:slide={{ duration: 300 }}
								out:slide={{ duration: 100 }}
							>
								{#key userKey}
									<ProfileAvatar
										userId={isTempUserKey(userKey) ? null : extractUserId(userKey)}
										tempUserId={isTempUserKey(userKey) ? extractUserId(userKey) : null}
										baseHeightPx={40}
									/><span
										>bringing {#if item.unit == BringListCountTypes.PER_PERSON}for
										{/if}
										{Math.round(quantity)}</span
									>
								{/key}
							</div>
						</div>
					{/if}
				{/each}
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
		</ScrollArea>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Custom slider track */
	input[type='range'] {
		-webkit-appearance: none; /* Removes default styles on WebKit browsers */
		width: 100%;
		height: 14px; /* Increased thickness */
		background: linear-gradient(to right, #3b82f6 0%, #1e3a8a 100%);
		border-radius: 999px; /* Rounded track */
		outline: none;
		transition: all 0.3s ease-in-out;
		position: relative;
		border: 1px solid #1e40af; /* Subtle border for depth */
	}

	/* The slider thumb (handle) */
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 26px; /* Larger size */
		height: 26px;
		background: #ffffff;
		border: 4px solid #1e40af;
		border-radius: 50%;
		cursor: pointer;
		transition:
			transform 0.2s,
			background 0.2s;
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 26px;
		height: 26px;
		background: #ffffff;
		border: 4px solid #1e40af;
		border-radius: 50%;
		cursor: pointer;
		transition:
			transform 0.2s,
			background 0.2s;
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
	}

	/* Hover & active states for the thumb */
	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		background: #f1f5f9;
	}

	input[type='range']::-webkit-slider-thumb:active {
		transform: scale(1.2);
		background: #e0e7ff;
	}

	/* Additional styling for Firefox */
	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.15);
		background: #f1f5f9;
	}

	input[type='range']::-moz-range-thumb:active {
		transform: scale(1.2);
		background: #e0e7ff;
	}

	/* Tooltip to show the max value at the right end */
	.slider-container {
		position: relative;
		width: 100%;
	}

	.slider-max {
		position: absolute;
		right: 0;
		top: -30px;
		background: #1e3a8a;
		color: white;
		font-size: 12px;
		padding: 5px 8px;
		border-radius: 6px;
		box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.2);
		font-weight: bold;
	}
</style>
