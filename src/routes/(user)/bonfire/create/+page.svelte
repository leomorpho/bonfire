<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { DateFormatter, type DateValue } from '@internationalized/date';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus, Clock } from 'lucide-svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import { TriplitClient } from '@triplit/client';
	import { schema } from '../../../../../triplit/schema';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import Datepicker from '$lib/components/Datepicker.svelte';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DateValue | undefined = $state<DateValue | undefined>();
	let eventName = $state(''); // State for event name
	let location = $state(''); // State for location
	let details = $state(''); // State for event details
	let startHour = $state(''); // State for hour
	let startMinute = $state(''); // State for minute
	let ampm = $state({ value: 'PM', label: 'PM' }); // State for AM/PM
	let timezone = $state({});

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
		<form class="space-y-2" onsubmit={handleSubmit}>
			<Input type="text" placeholder="Event Name" bind:value={eventName} class="w-full" />
			<Datepicker bind:value={dateValue} />

			<div class="flex flex-row items-center justify-center space-x-2">
				<Clock class="ml-1 mr-1 h-4 w-4" />

				<div class="font-mono"><DoubleDigitsPicker maxValue={12} bind:value={startHour} placeholder={"HH"}/></div>
				<div class="font-mono"><DoubleDigitsPicker bind:value={startMinute} placeholder="mm"/></div>

				<!-- <div class="w-18"><AmPmPicker bind:selected={ampm} /></div> -->
			</div>
			<TimezonePicker bind:value={timezone} />

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
