<script lang="ts">
	import { EventFormType } from './../enums.ts';
	import EventStyler from './EventStyler.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { DateFormatter, CalendarDate, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus, Minus, Clock, Clock8, ArrowDownToLine, Trash2 } from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import type { TriplitClient } from '@triplit/client';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Status } from '$lib/enums';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { overlayColorStore, overlayOpacityStore, styleStore } from '$lib/styles';

	let { mode, event = null } = $props();

	console.log(event);

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
	});

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DateValue | undefined = $state<DateValue | undefined>();
	let eventName: string = $state(event?.title ?? ''); // State for event name
	let location: string = $state(event?.location ?? ''); // State for location
	let details: string = $state(event?.description ?? ''); // State for event details
	let startHour = $state(''); // State for hour
	let startMinute = $state(''); // State for minute
	let ampmStart = $state('PM'); // State for AM/PM
	let endHour = $state(''); // State for hour
	let endMinute = $state(''); // State for minute
	let ampmEnd: string = $state('PM'); // State for AM/PM
	let finalStyleCss: string = $state(
		event?.style ??
			`--s: 140px; /* control the size*/
  --c1: #ab3e5b;
  --c2: #ffbe40;
  --c3: #accec0;
  --c4: #61a6ab;
  
  --_g: 
    #0000 25%,#0008 47%,var(--c1)  53% 147%,var(--c2) 153% 247%,
    var(--c1) 253% 347%,var(--c2) 353% 447%,var(--c1) 453% 547%,#0008 553%,#0000 575%;
  --_s: calc(25%/3) calc(25%/4) at 50%; 
  background:
    radial-gradient(var(--_s) 100%,var(--_g)),
    radial-gradient(var(--_s) 100%,var(--_g)) calc(var(--s)/2) calc(3*var(--s)/4),
    radial-gradient(var(--_s) 0   ,var(--_g)) calc(var(--s)/2) 0,
    radial-gradient(var(--_s) 0   ,var(--_g)) 0                calc(3*var(--s)/4),
    repeating-linear-gradient(90deg,var(--c3) calc(25%/-6) calc(25%/6),var(--c4) 0 calc(25%/2));
  background-size: var(--s) calc(3*var(--s)/2)
        
		}`
	);
	let overlayColor: string = $state(event?.overlay_color ?? '#000000');
	let overlayOpacity: number = $state(event?.overlay_opacity ?? 0.4);

	if (event) {
		const startTime = parseDateTime(event.start_time);
		startHour = startTime.hour;
		startMinute = startTime.minute;
		ampmStart = startTime.ampm;
		dateValue = startTime.dateValue;

		if (event.end_time) {
			const endTime = console.log(parseDateTime(event.end_time));
			endHour = startTime.hour;
			endMinute = startTime.minute;
			ampmEnd = startTime.ampm;
			setEndTime = true;
		}
	}

	let timezone = $state({});

	let setEndTime = $state(false);
	let submitDisabled = $state(true);

	function parseDateTime(isoString: string) {
		// Create a Date object from the ISO string
		const date = new Date(isoString);

		// Extract hour and minute
		let hours = date.getHours();
		const minutes = date.getMinutes();

		// Determine AM or PM
		const ampm = hours >= 12 ? 'PM' : 'AM';

		// Convert to 12-hour format
		hours = hours % 12 || 12; // Converts 0 to 12 for midnight

		// Create a DateValue using CalendarDate
		const dateValue: DateValue = new CalendarDate(
			date.getFullYear(),
			date.getMonth() + 1, // JS months are zero-based
			date.getDate()
		);

		// Return the parsed values
		return {
			hour: String(hours).padStart(2, '0'), // Ensure 2-digit format
			minute: String(minutes).padStart(2, '0'), // Ensure 2-digit format
			ampm,
			dateValue
		};
	}

	$effect(() => {
		if (dateValue && eventName && startHour) {
			submitDisabled = false;
		}
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		// Ensure basic validation
		if (!dateValue || !eventName) return;

		// Convert DateValue to a JS Date object for the event date
		const date = dateValue?.toDate();

		// Default startMinute to "00" if not provided
		const startMinutes = startMinute ? parseInt(startMinute) : 0;

		// Convert the hour to 24-hour format based on AM/PM for start time
		const startHours = (parseInt(startHour) % 12) + (ampmStart === 'PM' ? 12 : 0);

		// Set hours and minutes based on user input for start time
		date.setHours(startHours, startMinutes, 0, 0);

		// Convert the event date-time to the specified timezone for start time
		const eventStartDatetime = new Date(date.toLocaleString('en-US', { timeZone: timezone.value }));

		let eventEndDatetime = null;

		if (setEndTime) {
			// If end time is set, calculate end datetime
			const endHours = (parseInt(endHour) % 12) + (ampmEnd === 'PM' ? 12 : 0);
			const endMinutes = endMinute ? parseInt(endMinute) : 0;

			// Create a new Date object for end time, based on the same date
			const endDate = new Date(date);
			endDate.setHours(endHours, endMinutes, 0, 0);

			// Convert the event date-time to the specified timezone for end time
			eventEndDatetime = new Date(endDate.toLocaleString('en-US', { timeZone: timezone.value }));
		}
		const userId: string = (await waitForUserId()) as string;
		console.log({
			title: eventName,
			description: details || null,
			location: location || null,
			start_time: eventStartDatetime,
			end_time: eventEndDatetime,
			user_id: userId, // Use the authenticated user's ID
			timezone: timezone,
			style: finalStyleCss,
			overlay_color: overlayColor,
			overlay_opacity: overlayOpacity
		});

		if (mode == 'create') {
			// Save the event (uncomment in production)
			const { output } = await client.insert('events', {
				title: eventName,
				description: details || null,
				location: location || null,
				start_time: eventStartDatetime,
				end_time: eventEndDatetime,
				user_id: userId,
				style: finalStyleCss,
				overlay_color: overlayColor,
				overlay_opacity: overlayOpacity
			});

			// Set the stores so the event page updates with new style
			styleStore.set(finalStyleCss);
			overlayColorStore.set(overlayColor);
			overlayOpacityStore.set(overlayOpacity);

			if (output) {
				await client.insert('attendees', {
					user_id: userId,
					event_id: output.id as string,
					status: Status.DEFAULT // Default status
				});
			} else {
				console.log('Failed to create event object');
			}
			goto('/dashboard');
		} else {
			await client.update('events', event.id, async (entity) => {
				entity.title = eventName;
				entity.description = details || null;
				entity.location = location;
				entity.start_time = eventStartDatetime;
				entity.end_time = eventEndDatetime;
				entity.style = finalStyleCss;
				entity.overlay_color = overlayColor;
				entity.overlay_opacity = overlayOpacity;
			});
			styleStore.set(finalStyleCss);
			overlayColorStore.set(overlayColor);
			overlayOpacityStore.set(overlayOpacity);

			goto(`/bonfire/${event.id}`);
		}
	};

	const deleteEvent = async (e: Event) => {
		try {
			console.log('Event ID:', event.id);
			await client.delete('events', event.id);
			console.log('Deleted event!!!!');
			goto('/dashboard'); // Uncomment if redirection is needed
		} catch (error) {
			console.error('Error deleting event:', error);
		}
	};
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-5 rounded-xl bg-white p-2 text-lg font-semibold">
			{mode === EventFormType.CREATE ? 'Create' : 'Update'} a Bonfire
		</h2>
		<form class="space-y-2">
			<Input type="text" placeholder="Event Name" bind:value={eventName} class="w-full bg-white" />
			<Datepicker bind:value={dateValue} />

			<div class="flex flex-row items-center justify-between space-x-4">
				<!-- Start Time Inputs -->
				<div class="grid grid-cols-4 items-center gap-2">
					<Clock class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow" />
					<div class="font-mono">
						<DoubleDigitsPicker maxValue={12} bind:value={startHour} placeholder="HH" />
					</div>
					<div class="font-mono">
						<DoubleDigitsPicker bind:value={startMinute} placeholder="mm" />
					</div>
					<div class="w-18">
						<AmPmPicker onValueChange={(newValue: any) => (ampmStart = newValue)} />
					</div>
				</div>

				<!-- Toggle Button -->
				{#if !setEndTime}
					<Button
						onclick={() => {
							setEndTime = true;
						}}
						class="text-xs ring-glow"
					>
						<Plus class="ml-1 mr-1 h-2 w-2" />
						to
					</Button>
				{:else}
					<Button
						onclick={() => {
							setEndTime = false;
						}}
						class="text-xs ring-glow"
					>
						<Minus class="h-2 w-2" />
						to
					</Button>
				{/if}
			</div>

			{#if setEndTime}
				<div class="flex flex-row items-center justify-between space-x-4">
					<!-- End Time Inputs -->
					<div class="grid grid-cols-4 items-center gap-2">
						<Clock8 class="ml-4 mr-1 h-4 w-4 rounded-xl bg-white text-slate-500 ring-glow" />

						<div class="font-mono">
							<DoubleDigitsPicker maxValue={12} bind:value={endHour} placeholder="HH" />
						</div>
						<div class="font-mono">
							<DoubleDigitsPicker bind:value={endMinute} placeholder="mm" />
						</div>
						<div class="w-18">
							<AmPmPicker onValueChange={(newValue: any) => (ampmEnd = newValue)} />
						</div>
					</div>

					<!-- Invisible Button for Spacing -->
					<Button
						onclick={() => {
							setEndTime = false;
						}}
						class="invisible"
					>
						<Minus class="ml-1 mr-1 h-4 w-4" />
						to
					</Button>
				</div>
			{/if}

			<TimezonePicker onValueChange={(newValue: any) => (timezone = newValue)} />

			<div class="flex flex-row items-center">
				<Input type="text" placeholder="Location" class="w-full bg-white" bind:value={location} />
			</div>
			<Textarea class="bg-white" placeholder="Details" bind:value={details} />
		</form>
		{#if mode == EventFormType.UPDATE}
			<Dialog.Root>
				<Dialog.Trigger class="w-full"
					><Button disabled={submitDisabled} class="mt-2 w-full bg-red-500 hover:bg-red-400">
						<Trash2 class="ml-1 mr-1 h-4 w-4" /> Delete
					</Button></Dialog.Trigger
				>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
						<Dialog.Description>
							This action cannot be undone. This will permanently delete this event and remove its
							data from our servers.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer
						><Button
							disabled={submitDisabled}
							class="mt-2 w-full bg-red-500 hover:bg-red-400"
							onclick={deleteEvent}
						>
							<Trash2 class="ml-1 mr-1 h-4 w-4" /> Crush it
						</Button></Dialog.Footer
					>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</section>
	<Button
		disabled={submitDisabled}
		type="submit"
		class="sticky top-2 mt-2 w-full bg-green-600 ring-glow hover:bg-green-400 sm:w-[450px]"
		onclick={handleSubmit}
	>
		{#if mode == 'create'}
			<Plus class="ml-1 mr-1 h-4 w-4" />
		{:else}
			<ArrowDownToLine class="ml-1 mr-1 h-4 w-4" />
		{/if}

		{mode === EventFormType.CREATE ? 'Create' : 'Update'}
	</Button>
	<div class="md:7/8 w-5/6">
		<EventStyler bind:finalStyleCss bind:overlayColor bind:overlayOpacity />
	</div>
</div>
