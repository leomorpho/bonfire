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

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DateValue | undefined = undefined;
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Create a Bonfire</h2>
		<div class="space-y-2">
			<Input type="text" placeholder="Event Name" class="w-full" />
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
						<Calendar bind:dateValue />
					</Popover.Content>
				</Popover.Root>
			</div>
			<div class="flex flex-row items-center justify-center space-x-2">
				<Clock class="ml-1 mr-1 h-4 w-4" />

				<div class="font-mono"><DoubleDigitsPicker maxValue="12" /></div>
				<div class="font-mono"><DoubleDigitsPicker /></div>

				<div class="w-18"><AmPmPicker /></div>
			</div>
			<TimezonePicker class="w-full" />

			<div class="flex flex-row items-center">
				<Input type="text" placeholder="Location" class="w-full" />
			</div>
			<Textarea placeholder="Details" />
			<Button type="submit" class="w-full">
				<Plus class="ml-1 mr-1 h-4 w-4" />
				Create</Button
			>
		</div>
	</section>
</div>
