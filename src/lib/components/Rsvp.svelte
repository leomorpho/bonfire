<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Smile, Meh, Frown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import { DEFAULT, getStrValueOfRSVP, GOING, MAYBE, NOT_GOING } from '$lib/enums';
	import { and } from '@triplit/client';
	import AddToCalendar from './AddToCalendar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { rsvpStatus=DEFAULT, userId, eventId, rsvpCanBeChanged } = $props();

	// console.log('attendance', attendance);
	console.log('userId', userId);
	console.log('eventId', eventId);

	let showAddToCalendar = $state(false);

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
	});

	// let rsvpStatus: string = $state(DEFAULT);
	// if (attendance) {
	// 	rsvpStatus = attendance.status;
	// }

	let showAddToCalendarStatuses = new Set([GOING, MAYBE]);

	$effect(() => {
		showAddToCalendar = showAddToCalendarStatuses.has(rsvpStatus);
	});

	// Track dropdown state
	let dropdownOpen = $state(false);

	// Function to handle RSVP updates
	const updateRSVP = async (event: Event, newValue: string) => {
		event.preventDefault();

		try {
			const query = client
				.query('attendees')
				.where([
					and([
						['user_id', '=', userId],
						['event_id', '=', eventId as string]
					])
				])
				.build();
			let attendance = await client.fetchOne(query);

			// NOTE that we automatically create a RSVP status attendance object
			// upon navigation to an event if the user does not have an attendance object for it.
			attendance = await client.update('attendees', attendance.id, async (entity) => {
				entity.status = newValue;
			});

			rsvpStatus = newValue; // Update the label
			// Perform any additional actions, e.g., API call to save the new RSVP status
			console.log('RSVP updated to:', newValue);
		} catch (error) {
			console.log('failed to update RSVP status to:', newValue, error);
		}
		dropdownOpen = false;
	};
</script>

<div class="flex">
	<DropdownMenu.Root bind:open={dropdownOpen}>
		<DropdownMenu.Trigger
			class="w-full {rsvpCanBeChanged ? '' : 'pointer-events-none opacity-50'}"
			disabled={!rsvpCanBeChanged}
		>
			<Button
				variant="outline"
				class="mt-4 flex w-full items-center justify-center {rsvpStatus === GOING
					? 'bg-green-200 hover:bg-green-100'
					: ''} {rsvpStatus === MAYBE ? 'bg-yellow-200 hover:bg-yellow-100' : ''} {rsvpStatus ===
				NOT_GOING
					? 'bg-red-200 hover:bg-red-100'
					: ''}"
			>
				{getStrValueOfRSVP(rsvpStatus)}
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-full">
			<DropdownMenu.Group>
				<DropdownMenu.Item
					class={rsvpStatus === GOING ? 'bg-green-200' : ''}
					onclick={(event) => updateRSVP(event, GOING)}
				>
					<Smile /> Going
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class={rsvpStatus === MAYBE ? 'bg-yellow-200' : ''}
					onclick={(event) => updateRSVP(event, MAYBE)}
				>
					<Meh /> Maybe
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class={rsvpStatus === NOT_GOING ? 'bg-red-200' : ''}
					onclick={(event) => updateRSVP(event, NOT_GOING)}
				>
					<Frown /> Not going
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	{#if showAddToCalendar}
		<span class="ml-1"> <AddToCalendar /> </span>
	{/if}
</div>
