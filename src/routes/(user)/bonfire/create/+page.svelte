<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { DateFormatter, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus, Minus, Clock } from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import { TriplitClient } from '@triplit/client';
	import { schema } from '../../../../../triplit/schema';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { triplitClient, waitForUserId } from '$lib/triplit';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DateValue | undefined = $state<DateValue | undefined>();
	let eventName = $state(''); // State for event name
	let location = $state(''); // State for location
	let details = $state(''); // State for event details
	let startHour = $state(''); // State for hour
	let startMinute = $state(''); // State for minute
	let ampmStart = $state('PM'); // State for AM/PM
	let endHour = $state(''); // State for hour
	let endMinute = $state(''); // State for minute
	let ampmEnd = $state('PM'); // State for AM/PM

	let timezone = $state({});

	let setEndTime = $state(false);
	let submitDisabled = $state(true);

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
		const userId: string = await waitForUserId() as string;
		console.log({
			title: eventName,
			description: details || null,
			location: location || null,
			start_time: eventStartDatetime,
			end_time: eventEndDatetime,
			user_id: userId, // Use the authenticated user's ID
			timezone: timezone
		});

		// Save the event (uncomment in production)
		await triplitClient.insert('events', {
			title: eventName,
			description: details || null,
			location: location || null,
			start_time: eventStartDatetime,
			end_time: eventEndDatetime,
			user_id: userId // Use the authenticated user's ID
		});

		// Clear form fields (optional)
		// eventName = '';
		// location = '';
		// details = '';
		// dateValue = undefined;
		// startHour = '';
		// startMinute = '';
		// endHour = '';
		// endMinute = '';
		// ampmStart = 'AM';
		// ampmEnd = 'AM';
		// setEndTime = false;
	};
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Create a Bonfire</h2>
		<form class="space-y-2" onsubmit={handleSubmit}>
			<Input type="text" placeholder="Event Name" bind:value={eventName} class="w-full" />
			<Datepicker bind:value={dateValue} />

			<div class="flex flex-row items-center justify-between space-x-4">
				<!-- Start Time Inputs -->
				<div class="grid grid-cols-4 items-center gap-2">
					<Clock class="ml-4 mr-1 h-4 w-4 text-slate-500" />
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
						class="text-xs"
					>
						<Plus class="ml-1 mr-1 h-2 w-2" />
						to
					</Button>
				{:else}
					<Button
						onclick={() => {
							setEndTime = false;
						}}
						class="text-xs"
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
						<Clock class="ml-4 mr-1 h-4 w-4 text-slate-500" />
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
				<Input type="text" placeholder="Location" class="w-full" bind:value={location} />
			</div>
			<Textarea placeholder="Details" bind:value={details} />
			<Button disabled={submitDisabled} type="submit" class="w-full">
				<Plus class="ml-1 mr-1 h-4 w-4" />
				Create
			</Button>
		</form>
	</section>
</div>
