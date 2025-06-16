<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import Datepicker from '$lib/components/Datepicker.svelte';
	import DoubleDigitsPicker from '$lib/components/DoubleDigitsPicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import type { FlowData } from '../flow-enums';
	import { Clock, Plus } from 'lucide-svelte';
	import type { DateValue } from '@internationalized/date';

	let { data }: { data: FlowData } = $props();

	let startDateValue = $state<DateValue>();
	let startHour = $state(data.startTime?.hour || '');
	let startMinute = $state(data.startTime?.minute || '');
	let startAmPm = $state(data.startTime?.ampm || 'PM');

	let hasEndTime = $state(data.hasEndTime || false);
	let endDateValue = $state<DateValue>();
	let endHour = $state(data.endTime?.hour || '');
	let endMinute = $state(data.endTime?.minute || '');
	let endAmPm = $state(data.endTime?.ampm || 'PM');

	// Update data when inputs change
	$effect(() => {
		if (startDateValue) {
			data.startDate = new Date(startDateValue.year, startDateValue.month - 1, startDateValue.day);
		}

		if (startHour && startMinute) {
			data.startTime = {
				hour: startHour,
				minute: startMinute,
				ampm: startAmPm
			};
		}

		data.hasEndTime = hasEndTime;

		if (hasEndTime) {
			if (endDateValue) {
				data.endDate = new Date(endDateValue.year, endDateValue.month - 1, endDateValue.day);
			} else if (data.startDate) {
				data.endDate = data.startDate; // Default to same day
			}

			if (endHour && endMinute) {
				data.endTime = {
					hour: endHour,
					minute: endMinute,
					ampm: endAmPm
				};
			}
		} else {
			data.endDate = undefined;
			data.endTime = undefined;
		}
	});

	function addEndTime() {
		hasEndTime = true;
		// Pre-fill with start time + 2 hours as default
		if (startHour && startMinute) {
			let hour = parseInt(startHour);
			let minute = parseInt(startMinute);
			let ampm = startAmPm;

			// Add 2 hours
			hour += 2;
			if (hour > 12) {
				hour -= 12;
				ampm = ampm === 'AM' ? 'PM' : 'AM';
			}

			endHour = hour.toString();
			endMinute = minute.toString().padStart(2, '0');
			endAmPm = ampm;
		}
	}
</script>

<div class="space-y-6">
	<!-- Start Date -->
	<div>
		<Label class="text-base font-medium">Event Date</Label>
		<div class="mt-2">
			<Datepicker bind:value={startDateValue} />
		</div>
	</div>

	<!-- Start Time -->
	<div>
		<Label class="text-base font-medium">Start Time</Label>
		<div class="mt-2 flex items-center gap-2">
			<DoubleDigitsPicker bind:value={startHour} placeholder="HH" minValue={1} maxValue={12} />
			<span class="text-lg">:</span>
			<DoubleDigitsPicker bind:value={startMinute} placeholder="MM" minValue={0} maxValue={59} />
			<AmPmPicker bind:value={startAmPm} />
		</div>
	</div>

	<!-- End Time Section -->
	<div class="border-t pt-4">
		{#if !hasEndTime}
			<Button variant="outline" onclick={addEndTime} class="w-full">
				<Plus class="mr-2 h-4 w-4" />
				Add End Time
			</Button>
			<p class="mt-2 text-center text-sm text-gray-500">Optional: Set when your event ends</p>
		{:else}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<Label class="text-base font-medium">End Time</Label>
					<Button variant="ghost" size="sm" onclick={() => (hasEndTime = false)}>Remove</Button>
				</div>

				<!-- End Date (only show if different from start date) -->
				<div>
					<Label class="text-sm font-medium text-gray-600">End Date</Label>
					<div class="mt-1">
						<Datepicker bind:value={endDateValue} />
					</div>
					<p class="mt-1 text-xs text-gray-500">Leave blank to use the same date as start</p>
				</div>

				<!-- End Time -->
				<div>
					<Label class="text-sm font-medium text-gray-600">Time</Label>
					<div class="mt-1 flex items-center gap-2">
						<DoubleDigitsPicker bind:value={endHour} placeholder="HH" minValue={1} maxValue={12} />
						<span class="text-lg">:</span>
						<DoubleDigitsPicker
							bind:value={endMinute}
							placeholder="MM"
							minValue={0}
							maxValue={59}
						/>
						<AmPmPicker bind:value={endAmPm} />
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Preview -->
	{#if data.startDate && data.startTime?.hour}
		<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
			<div class="flex items-center gap-2 text-sm">
				<Clock class="h-4 w-4" />
				<span class="font-medium">Event Time:</span>
			</div>
			<p class="mt-1 text-gray-700 dark:text-gray-300">
				{data.startDate.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
				at {data.startTime.hour}:{data.startTime.minute.padStart(2, '0')}
				{data.startTime.ampm}
				{#if hasEndTime && data.endTime?.hour}
					- {data.endTime.hour}:{data.endTime.minute.padStart(2, '0')}
					{data.endTime.ampm}
					{#if data.endDate && data.endDate.getTime() !== data.startDate.getTime()}
						({data.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
					{/if}
				{/if}
			</p>
		</div>
	{/if}
</div>
