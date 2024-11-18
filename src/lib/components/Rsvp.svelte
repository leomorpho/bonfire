<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Smile, Meh, Frown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { TriplitClient } from '@triplit/client';
	import { feTriplitClient } from '$lib/triplit';

	let { attendance, userId, eventId } = $props();

	console.log('attendance', attendance);
	console.log('userId', userId);
	console.log('eventId', eventId);

	let client = feTriplitClient as TriplitClient;

	const GOING = 'going';
	const NOT_GOING = 'not_going';
	const MAYBE = 'maybe';
	const DEFAULT = 'RSVP';

	const getStrValueOfRSVP = (status: string) => {
		switch (status) {
			case GOING:
				return 'Going';
			case NOT_GOING:
				return 'Not going';
			case MAYBE:
				return 'Maybe';
			default:
				return 'RSVP';
		}
	};

	let rsvpStatus: string = $state(DEFAULT);
	if (attendance) {
		rsvpStatus = attendance.status;
	}

	// Function to handle RSVP updates
	const updateRSVP = async (newValue: string) => {
		try {
			if (rsvpStatus == DEFAULT) {
				// Create
				await client.insert('attendees', {
					event_id: eventId,
					user_id: userId,
					status: newValue
				});
			} else {
				// Update
				attendance = await client.update('attendees', attendance.id, async (entity) => {
					entity.status = newValue;
				});
			}
			rsvpStatus = newValue; // Update the label
			// Perform any additional actions, e.g., API call to save the new RSVP status
			console.log('RSVP updated to:', newValue);
		} catch (error) {
			console.log('failed to update RSVP status to:', newValue, error);
		}
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="w-full">
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
				class="cursor-pointer {rsvpStatus === GOING ? 'bg-green-200' : ''}"
				onclick={() => updateRSVP(GOING)}
			>
				<Smile /> Going
			</DropdownMenu.Item>
			<DropdownMenu.Item
				class="cursor-pointer {rsvpStatus === MAYBE ? 'bg-yellow-200' : ''}"
				onclick={() => updateRSVP(MAYBE)}
			>
				<Meh /> Maybe
			</DropdownMenu.Item>
			<DropdownMenu.Item
				class="cursor-pointer {rsvpStatus === NOT_GOING ? 'bg-red-200' : ''}"
				onclick={() => updateRSVP(NOT_GOING)}
			>
				<Frown /> Not going
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
