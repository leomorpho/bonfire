<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import CalendarIcon from 'svelte-radix/Calendar.svelte';
	import { DateFormatter, type DatedateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import TimePicker from '$lib/components/TimePicker.svelte';
	import AmPmPicker from '$lib/components/AmPmPicker.svelte';
	import TimezonePicker from '$lib/components/TimezonePicker.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Plus } from 'lucide-svelte';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let dateValue: DatedateValue | undefined = undefined;
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Create a Bonfire</h2>
		<div class="max-w-xs space-y-2">
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
			<div class="flex flex-row space-x-2">
				<TimePicker />
				<AmPmPicker />
			</div>
			<TimezonePicker class="w-full" />
			<Input type="text" placeholder="Location" class="max-w-xs" />
			<Textarea placeholder="Details" />
			<Button type="submit" class="w-full">
				<Plus class="ml-1 mr-1 h-4 w-4" />
				Create</Button
			>
		</div>
	</section>
</div>
