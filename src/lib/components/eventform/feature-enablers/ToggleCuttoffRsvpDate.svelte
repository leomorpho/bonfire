<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import { Hourglass } from 'lucide-svelte';
	import Checkbox from '../../ui/checkbox/checkbox.svelte';
	import { slide } from 'svelte/transition';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import { calculateLeadTimeInDays } from '$lib/utils';
	import { parseDate, type DateValue } from '@internationalized/date';

	let {
		oninput,
		maxCutoffDate,
		eventStartDatetime,
		timezone,
		checked = $bindable<boolean>(false),
		cuttoffDate = $bindable<Date>()
	} = $props();

	let dateValue: DateValue | undefined = $state();
	let startHour = $state('01');
	let startMinute = $state('00');
	let ampmStart = $state('');

	let leadTimeInDays: number | null = $state(null);

	$effect(() => {
		if (!dateValue && cuttoffDate) {
			dateValue = cuttoffDate
				? parseDate(
						new Date(cuttoffDate.getFullYear(), cuttoffDate.getMonth(), cuttoffDate.getDate())
							.toISOString()
							.split('T')[0]
					)
				: undefined;
		}
	});

	const updateCuttoffDate = () => {
		if (!dateValue) return;

		// Convert DateValue to a JS Date object for the event date
		const date = dateValue?.toDate();

		// Default startMinute to "00" if not provided
		const startMinutes = startMinute ? parseInt(startMinute) : 0;

		// Convert the hour to 24-hour format based on AM/PM for start time
		const startHours = (parseInt(startHour) % 12) + (ampmStart === 'PM' ? 12 : 0);

		// Set hours and minutes based on user input for start time
		date.setHours(startHours, startMinutes, 0, 0);

		// Convert the event date-time to the specified timezone for start time
		cuttoffDate = new Date(date.toLocaleString('en-US', { timeZone: timezone.value }));
	};

	$effect(() => {
		if (eventStartDatetime && cuttoffDate) {
			leadTimeInDays = calculateLeadTimeInDays(eventStartDatetime, cuttoffDate);
		}
	});

	$effect(() => {
		if (!cuttoffDate) {
			const newDate = new Date(eventStartDatetime);
			// Subtract 2 days from the new Date object
			newDate.setDate(newDate.getDate() - 2);
			cuttoffDate = new Date(newDate.toLocaleString('en-US', { timeZone: timezone.value }));
		}
	});

	const update = async () => {
		updateCuttoffDate();
		oninput();
	};
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="enable-instant-messaging" bind:checked onclick={update} />
		<Label
			for="enable-instant-messaging"
			class="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			<Hourglass class="mx-1 h-5 w-5" /> Set cuttof RSVP date
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input with Svelte Slide Transition -->
		<div
			transition:slide={{ duration: 300 }}
			class="mt-4 flex flex-col items-center space-y-3 overflow-hidden"
		>
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Useful if you want to make sure your RSVP list does not grow after a certain date.
			</p>
			<div class="space-y-3 py-1">
				{#if leadTimeInDays}
					<div class="flex w-full justify-center text-sm">
						<strong
							>Closing {leadTimeInDays}
							{leadTimeInDays > 1 ? 'days' : 'day'} ahead of event start</strong
						>
					</div>
				{/if}

				<Datepicker bind:value={dateValue} oninput={update} maxValue={maxCutoffDate} />

				<div class="flex flex-row items-center justify-between space-x-4">
					<!-- Start Time Inputs -->
					<div class="flex w-full justify-center space-x-1">
						<div class="font-mono">
							<DoubleDigitsPicker
								maxValue={12}
								bind:value={startHour}
								placeholder="HH"
								oninput={update}
							/>
						</div>
						<div class="font-mono">
							<DoubleDigitsPicker bind:value={startMinute} placeholder="mm" oninput={update} />
						</div>
						<div class="w-18">
							<AmPmPicker
								onValueChange={(newValue: any) => (ampmStart = newValue)}
								oninput={update}
							/>
						</div>
					</div>
				</div>
				<div class="flex w-full justify-center text-xs">
					(in {timezone.label} timezone)
				</div>
			</div>
		</div>
	{/if}
</div>
