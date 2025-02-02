<script lang="ts">
	import EventStyler from './EventStyler.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { CalendarDate, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Plus,
		Minus,
		Clock,
		Clock8,
		ArrowDownToLine,
		Trash2,
		Palette,
		Shield
	} from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import type { TriplitClient } from '@triplit/client';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { EventFormType, Status } from '$lib/enums';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		overlayColorStore,
		overlayOpacityStore,
		parseColor,
		stylesGallery,
		styleStore,
		randomSort
	} from '$lib/styles';
	import { generatePassphraseId } from '$lib/utils';
	import TextAreaAutoGrow from './TextAreaAutoGrow.svelte';
	import ChevronLeft from 'svelte-radix/ChevronLeft.svelte';
	import LocationInput from './LocationInput.svelte';
	import EventAdminEditor from './EventAdminEditor.svelte';

	let { mode, event = null, currUserId = null } = $props();

	const editingMainEvent = 'editing_main_event';
	const editingStyles = 'editing_styles';
	const editingAdmins = 'editing_admins';

	// console.log(event);

	let client: TriplitClient;

	let dateValue: DateValue | undefined = $state<DateValue | undefined>();
	let eventName: string = $state(event?.title ?? ''); // State for event name
	let location: string = $state(event?.location ?? ''); // State for location
	let geocodedLocation: any = $state(
		event?.geocoded_location ? JSON.parse(event?.geocoded_location) : ''
	); // State for geocoded location
	let details: string = $state(event?.description ?? ''); // State for event details
	let startHour = $state(''); // State for hour
	let startMinute = $state(''); // State for minute
	let ampmStart = $state('PM'); // State for AM/PM
	let endHour = $state(''); // State for hour
	let endMinute = $state(''); // State for minute
	let ampmEnd: string = $state('PM'); // State for AM/PM

	const defaultBackground = randomSort(stylesGallery)[0].cssTemplate;
	console.log('defaultBackground', defaultBackground);
	let finalStyleCss: string = $state(event?.style ?? defaultBackground);
	let overlayColor: string = $state(event?.overlay_color ?? '#000000');
	let overlayOpacity: number = $state(event?.overlay_opacity ?? 0.4);

	let currentEventEditingMode = $state(editingMainEvent);
	let cancelUrl = $state(event && event.id ? `/bonfire/${event.id}` : '/');
	let timezone = $state({});
	let setEndTime = $state(false);
	let submitDisabled = $derived(!(dateValue && eventName.length > 0 && startHour.length > 0));
	let isEventSaving = $state(false);
	let errorMessage = $state('');
	let showError = $state(false);

	// NOTE: this is a hack and I dont like it. The way to go is refactor the code in EventStyler so it's reusable.
	$effect(() => {
		if (finalStyleCss) {
			// Replace the placeholder selector with the actual target
			const completeCss = `
		.bg-color-selector {
			${finalStyleCss}
		}

		.bg-overlay-selector {
				background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});
			}
		`;

			// console.log('applying css', completeCss);

			// Create a new <style> tag for the selected preview style
			const styleElement = document.createElement('style');
			styleElement.type = 'text/css';
			styleElement.textContent = completeCss;
			document.head.appendChild(styleElement);
		}
	});

	if (event) {
		const startTime = parseDateTime(event.start_time);
		startHour = startTime.hour;
		startMinute = startTime.minute;
		ampmStart = startTime.ampm;
		dateValue = startTime.dateValue;

		if (event.end_time) {
			const endTime = parseDateTime(event.end_time);
			endHour = endTime.hour;
			endMinute = endTime.minute;
			ampmEnd = endTime.ampm;
			setEndTime = true;
		}
	}

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

	// $effect(() => {
	// 	console.log(
	// 		'submitDisabled',
	// 		submitDisabled,
	// 		'dateValue',
	// 		dateValue,
	// 		'eventName',
	// 		eventName,
	// 		'startHour',
	// 		startHour
	// 	);
	// });

	const handleSubmit = async (e: Event) => {
		try {
			errorMessage = '';
			showError = false;
			isEventSaving = true;
			e.preventDefault();

			// Ensure basic validation
			if (!dateValue || !eventName) {
				errorMessage = 'Please fill in all required fields';
				showError = true;
				return;
			}

			// Convert DateValue to a JS Date object for the event date
			const date = dateValue?.toDate();

			// Default startMinute to "00" if not provided
			const startMinutes = startMinute ? parseInt(startMinute) : 0;

			// Convert the hour to 24-hour format based on AM/PM for start time
			const startHours = (parseInt(startHour) % 12) + (ampmStart === 'PM' ? 12 : 0);

			// Set hours and minutes based on user input for start time
			date.setHours(startHours, startMinutes, 0, 0);

			// Convert the event date-time to the specified timezone for start time
			const eventStartDatetime = new Date(
				date.toLocaleString('en-US', { timeZone: timezone.value })
			);

			let eventEndDatetime = null;

			if (setEndTime) {
				// If end time is set, calculate end datetime
				const endHours = (parseInt(endHour) % 12) + (ampmEnd === 'PM' ? 12 : 0);
				const endMinutes = endMinute ? parseInt(endMinute) : 0;

				// Create a new Date object for end time, based on the same date
				const endDate = new Date(date);
				endDate.setHours(endHours, endMinutes, 0, 0);

				// Check if end time is before start time
				if (endDate < date) {
					errorMessage = 'End time must be after start time';
					showError = true;
					return;
				}

				// Convert the event date-time to the specified timezone for end time
				eventEndDatetime = new Date(endDate.toLocaleString('en-US', { timeZone: timezone.value }));
			}

			const userId: string = (await waitForUserId()) as string;
			if (!userId) {
				errorMessage = 'User authentication failed';
				showError = true;
				return;
			}

			let eventId = event?.id;

			if (mode == EventFormType.CREATE) {
				eventId = await generatePassphraseId();

				try {
					await client.transact(async (tx) => {
						// Insert the event
						await tx.insert('events', {
							id: eventId,
							title: eventName,
							description: details || null,
							location: location || null,
							geocoded_location: JSON.stringify(geocodedLocation) || null,
							start_time: eventStartDatetime,
							end_time: eventEndDatetime,
							user_id: userId,
							style: finalStyleCss,
							overlay_color: overlayColor,
							overlay_opacity: overlayOpacity
						});

						// Add the user as an attendee
						await tx.insert('attendees', {
							user_id: userId,
							event_id: eventId as string,
							status: Status.GOING
						});
					});

					// If the transaction succeeds
					console.log('Event and attendee created successfully.');
				} catch (transactionError) {
					// Handle transaction failure
					console.error('Transaction failed:', transactionError);
					errorMessage = 'Failed to create event and add you as an attendee. Please try again.';
					showError = true;
				}

				// Set the stores so the event page updates with new style
				styleStore.set(finalStyleCss);
				overlayColorStore.set(overlayColor);
				overlayOpacityStore.set(overlayOpacity);
			} else {
				try {
					await client.update('events', event.id, async (entity) => {
						entity.title = eventName;
						entity.description = details || null;
						entity.location = location;
						entity.geocoded_location = JSON.stringify(geocodedLocation);
						entity.start_time = eventStartDatetime;
						entity.end_time = eventEndDatetime;
						entity.style = finalStyleCss;
						entity.overlay_color = overlayColor;
						entity.overlay_opacity = overlayOpacity;
					});

					styleStore.set(finalStyleCss);
					overlayColorStore.set(overlayColor);
					overlayOpacityStore.set(overlayOpacity);
				} catch (error) {
					errorMessage = 'Failed to update event. Please try again.';
					showError = true;
					return;
				}
			}

			// Only redirect if everything succeeded
			if (eventId) {
				goto(`/bonfire/${eventId}`);
			}
		} catch (e) {
			console.error(`Failed to ${mode === EventFormType.CREATE ? 'create' : 'update'} event`, e);
			errorMessage = `Failed to ${mode === EventFormType.CREATE ? 'create' : 'update'} event. Please try again.`;
			showError = true;
		} finally {
			isEventSaving = false;
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

	const startEditEventStyle = () => {
		currentEventEditingMode = editingStyles;
	};
	const stopEditEventStyle = () => {
		currentEventEditingMode = editingMainEvent;
	};

	const startEditAdmins = () => {
		currentEventEditingMode = editingAdmins;
	};
	const stopEditAdmins = () => {
		currentEventEditingMode = editingMainEvent;
	};

	onMount(() => {
		styleStore.set(finalStyleCss);
		overlayColorStore.set(overlayColor);
		overlayOpacityStore.set(overlayOpacity);

		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		(async () => {
			// NOTE: for testing
			console.log('generatePassphraseId()', await generatePassphraseId());
		})();
	});
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	{#if currentEventEditingMode == editingMainEvent}
		<section class="mt-8 w-full sm:w-[450px]">
			<h2 class="mb-5 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold">
				{mode === EventFormType.CREATE ? EventFormType.CREATE : EventFormType.UPDATE} a Bonfire
			</h2>
			<form class="space-y-2">
				<Input
					type="text"
					placeholder="Event Name"
					bind:value={eventName}
					class="w-full bg-white"
				/>
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
								endHour = '';
								endMinute = '';
								ampmEnd = '';
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

						<!-- Toggle Button -->

						<Button class="hidden text-xs ring-glow"></Button>
					</div>
				{/if}

				<TimezonePicker onValueChange={(newValue: any) => (timezone = newValue)} />

				<div class="flex flex-row items-center">
					<LocationInput bind:location bind:geocodedLocation />
				</div>
				<TextAreaAutoGrow cls={'bg-white'} placeholder="Details" bind:value={details} />
			</form>

			<div class="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
				<Button class="justify-centerp-4 flex items-center" onclick={startEditEventStyle}>
					<Palette class="mr-1" />
					Edit event style
				</Button>
				{#if event?.user_id == currUserId}
					<Button
						class="flex items-center justify-center p-4"
						disabled={!event}
						onclick={startEditAdmins}
					>
						<Shield class="mr-1" />
						Edit admins
					</Button>
				{/if}
			</div>
		</section>
		<div class="my-10 w-full sm:w-[450px]">
			<a href={cancelUrl}>
				<Button class="sticky top-2 mt-2 w-full ring-glow">Cancel</Button>
			</a>
			<Button
				id="upsert-bonfire"
				disabled={submitDisabled}
				type="submit"
				class={`sticky top-2 mt-2 w-full ${submitDisabled ? 'bg-slate-400' : 'bg-green-500 hover:bg-green-400'} ring-glow`}
				onclick={handleSubmit}
			>
				{#if isEventSaving}
					<span class="loading loading-spinner loading-xs ml-2"> </span>
				{/if}
				{#if mode == EventFormType.CREATE}
					<Plus class="ml-1 mr-1 h-4 w-4" />
				{:else}
					<ArrowDownToLine class="ml-1 mr-1 h-4 w-4" />
				{/if}

				{mode === EventFormType.CREATE ? EventFormType.CREATE : EventFormType.UPDATE}
			</Button>
			{#if mode == EventFormType.UPDATE && currUserId == event.user_id}
				<Dialog.Root>
					<Dialog.Trigger class="w-full" disabled={submitDisabled || currUserId != event.user_id}
						><Button
							disabled={submitDisabled || currUserId != event.user_id}
							class="mt-2 w-full bg-red-500 ring-glow hover:bg-red-400"
						>
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
		</div>
	{:else if currentEventEditingMode == editingStyles}
		<div class="md:7/8 w-5/6">
			<div class="sticky top-2 mt-2 flex justify-center">
				<Button
					class="w-full bg-violet-500 ring-glow hover:bg-violet-400 sm:w-[450px]"
					onclick={stopEditEventStyle}
				>
					<ChevronLeft class="mr-1" />

					Back
				</Button>
			</div>

			<EventStyler bind:finalStyleCss bind:overlayColor bind:overlayOpacity />
		</div>
	{:else if currentEventEditingMode == editingAdmins}
		<div class="md:7/8 w-5/6">
			<div class="sticky top-2 mt-2 flex justify-center">
				<Button
					class="w-full bg-violet-500 ring-glow hover:bg-violet-400 sm:w-[450px]"
					onclick={stopEditAdmins}
				>
					<ChevronLeft class="mr-1" />

					Back
				</Button>
			</div>
			<EventAdminEditor eventId={event?.id} {currUserId} eventCreatorId={event?.user_id} />
		</div>
	{/if}
	{#if showError}
		<div class="mt-2 rounded-md bg-red-100 p-3 text-red-700">
			{errorMessage}
		</div>
	{/if}
</div>
