<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Smile, Meh, Frown, HandMetal } from 'lucide-svelte';
	import type { TriplitClient } from '@triplit/client';
	import { and } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import { getStrValueOfRSVP, NOTIFY_OF_ATTENDING_STATUS_CHANGE, Status } from '$lib/enums';
	import AddToCalendar from './AddToCalendar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { createNewAttendanceNotificationQueueObject } from '$lib/notification';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let { rsvpStatus = Status.DEFAULT, userId, eventId, isAnonymousUser } = $props();

	let isAnonRsvpDialogOpen = $state(false);

	if (!rsvpStatus) {
		rsvpStatus = Status.DEFAULT;
	}

	// console.log('attendance', attendance);
	console.log('userId', userId);
	console.log('eventId', eventId);

	let showAddToCalendar = $state(false);

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
	});

	let showAddToCalendarStatuses = new Set([Status.GOING, Status.MAYBE]);

	$effect(() => {
		showAddToCalendar = showAddToCalendarStatuses.has(rsvpStatus);
	});

	// Track dropdown state
	let dropdownOpen = $state(false);

	// Function to handle RSVP updates
	const updateRSVP = async (event: Event, newValue: string) => {
		event.preventDefault();
		console.log('updating RSVP status');
		if (isAnonymousUser) {
			isAnonRsvpDialogOpen = true;
			// Show modal to either
			// (a) log in with magic link and have that event be linked to their account right away
			// (b) enter a name and generate a unique link to access the event with their temporary identity
		} else {
			await updateRSVPForLoggedInUser(newValue);
		}
		dropdownOpen = false;
	};
	const updateRSVPForAnonymousUser = async (newValue: string) => {
		// TODO: capture a username in a dialog, then save it to DB and show user a URL to re-access with that identity
	};

	const updateRSVPForLoggedInUser = async (newValue: string) => {
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

			if (!attendance) {
				return;
			}

			// NOTE that we automatically create a RSVP status attendance object
			// upon navigation to an event if the user does not have an attendance object for it.
			attendance = await client.update('attendees', attendance.id, async (entity) => {
				entity.status = newValue;
			});

			rsvpStatus = newValue; // Update the label

			if (NOTIFY_OF_ATTENDING_STATUS_CHANGE.includes(rsvpStatus)) {
				await createNewAttendanceNotificationQueueObject(client, userId, eventId, attendance.id);
			}

			// Perform any additional actions, e.g., API call to save the new RSVP status
			console.log('RSVP updated to:', newValue);
		} catch (error) {
			console.log('failed to update RSVP status to:', newValue, error);
		}
	};
</script>

<div class="flex">
	<DropdownMenu.Root bind:open={dropdownOpen}>
		<DropdownMenu.Trigger class="w-full">
			<Button
				variant="outline"
				class="mt-4 flex w-full items-center justify-center {rsvpStatus === Status.GOING
					? 'bg-green-400 hover:bg-green-100'
					: ''} {rsvpStatus === Status.MAYBE
					? 'bg-yellow-400 hover:bg-yellow-100'
					: ''} {rsvpStatus === Status.NOT_GOING
					? 'bg-red-400 hover:bg-red-100'
					: ''} {rsvpStatus === Status.DEFAULT ? 'bg-purple-300 hover:bg-purple-100' : ''}"
			>
				{#if rsvpStatus === Status.DEFAULT || rsvpStatus == null}
					<HandMetal class="mr-2" />
				{/if}
				{getStrValueOfRSVP(rsvpStatus)}
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-full">
			<DropdownMenu.Group>
				<DropdownMenu.Item
					class={rsvpStatus === Status.GOING ? 'bg-green-400' : ''}
					onclick={(event) => updateRSVP(event, Status.GOING)}
				>
					<Smile /> Going
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class={rsvpStatus === Status.MAYBE ? 'bg-yellow-400' : ''}
					onclick={(event) => updateRSVP(event, Status.MAYBE)}
				>
					<Meh /> Maybe
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class={rsvpStatus === Status.NOT_GOING ? 'bg-red-400' : ''}
					onclick={(event) => updateRSVP(event, Status.NOT_GOING)}
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

<Dialog.Root bind:open={isAnonRsvpDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Hey There!</Dialog.Title>
			<Dialog.Description>There are two ways to set your RSVP status.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			<a href="/login">
				<Button class="w-full bg-green-500 text-lg">Login with magic link</Button>
			</a>
		</div>

		<div class="inline-flex w-full items-center justify-center">
			<hr class="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
			<span
				class="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white"
				>or</span
			>
		</div>
		<div class="space-y-3">
			<div class="mb-2 text-lg">Generate unique URL</div>
			<p class="text-sm text-slate-600">
				A unique URL that connects your actions to this event. Keep it open in a tab or save it for
				future access—don’t lose it! This link serves as your identity for this event.
			</p>
			<div class="mb-2 grid grid-cols-4 items-center gap-4">
				<Label for="username" class="text-right">Name</Label>
				<Input id="username" value="Tony Garfunkel" class="col-span-3" />
			</div>
			<Button type="submit" class="w-full">Generate URL</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
