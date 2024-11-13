<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import CalendarIcon from 'svelte-radix/Calendar.svelte';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus, Clock } from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import { TriplitClient } from '@triplit/client';
	import { schema } from '../../../../../triplit/schema';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DateValue | undefined = undefined;
	let eventName = ''; // State for event name
	let location = ''; // State for location
	let details = ''; // State for event details
	let startHour = ''; // State for hour
	let startMinute = ''; // State for minute
	let ampm = { value: 'PM', label: 'PM' }; // State for AM/PM
	let timezone = {};

	const client = new TriplitClient({ schema });

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		// Ensure basic validation
		if (!dateValue || !eventName) return;

		// Convert DateValue to a JS Date object for the event date
		const date = dateValue?.toDate();

		// Convert the hour to 24-hour format based on AM/PM
		const hours = (parseInt(startHour) % 12) + (ampm.value === 'PM' ? 12 : 0);

		// Set hours and minutes based on user input
		date.setHours(hours, parseInt(startMinute), 0, 0);

		// Convert the event date-time to the specified timezone
		const eventDateTime = new Date(date.toLocaleString('en-US', { timeZone: timezone.value }));

		console.log({
			title: eventName,
			description: details || null,
			location: location || null,
			start_time: eventDateTime,
			end_time: null, // Set `end_time` as `null` if not provided
			user_id: 'userId', // Use the authenticated user's ID
			timezone: timezone,
			ampm: ampm
		});
		// await client.insert('events', {
		// 	title: eventName,
		// 	description: details || null,
		// 	location: location || null,
		// 	start_time: eventDateTime,
		// 	end_time: null, // Set `end_time` as `null` if not provided
		// 	user_id: "userId", // Use the authenticated user's ID
		// });

		// Clear form fields
		// eventName = '';
		// location = '';
		// details = '';
		// dateValue = undefined;
		// startHour = '';
		// startMinute = '';
		// ampm = 'AM';
	};
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Create a Bonfire</h2>
		<form class="space-y-2" on:submit={handleSubmit}>
			<Input type="text" placeholder="Event Name" bind:value={eventName} class="w-full" />
			<div>
				<Popover.Root>
					<Popover.Trigger asChild let:builder>
						<Button
							variant="outline"
							class={cn(
								'w-full justify-start text-left font-normal',
								!dateValue && 'text-muted-foreground'
							)}
							builders={[builder]}
						>
							<CalendarIcon class="mr-2 h-4 w-4" />
							{dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : 'Pick a date'}
						</Button>
					</Popover.Trigger>
					<Popover.Content class="w-auto p-0" align="start">
						<Calendar bind:value={dateValue} />
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="flex flex-row items-center justify-center space-x-2">
				<Clock class="ml-1 mr-1 h-4 w-4" />

				<div class="font-mono"><DoubleDigitsPicker maxValue={12} bind:value={startHour} /></div>
				<div class="font-mono"><DoubleDigitsPicker bind:value={startMinute} /></div>

				<div class="w-18"><AmPmPicker bind:selected={ampm} /></div>
			</div>
			<TimezonePicker class="w-full" bind:selectedTimezone={timezone} />

			<div class="flex flex-row items-center">
				<Input type="text" placeholder="Location" class="w-full" bind:value={location} />
			</div>
			<Textarea placeholder="Details" bind:value={details} />
			<Button type="submit" class="w-full">
				<Plus class="ml-1 mr-1 h-4 w-4" />
				Create
			</Button>
		</form>
	</section>
</div>
