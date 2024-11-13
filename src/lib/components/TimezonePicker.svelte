<script lang="ts">
	import Check from 'svelte-radix/Check.svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import { tick } from 'svelte';

	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	import * as Select from '$lib/components/ui/select/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Earth } from 'lucide-svelte';

	// Timezone data and selection
	export let selectedTimezone = undefined;
	let timezoneOptions = [];

	// Helper function to get the UTC offset for a timezone in hours
	function getTimezoneOffset(timezone: string): number {
		const now = new Date();
		const dateInTimezone = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			timeZoneName: 'short'
		}).formatToParts(now);
		const offsetString = dateInTimezone.find((part) => part.type === 'timeZoneName')?.value || '';
		const match = offsetString.match(/GMT([+-]\d+)/);
		return match ? parseInt(match[1], 10) : 0;
	}

	// Generate timezone options dynamically
	function loadTimezoneOptions() {
		const timezones = Intl.supportedValuesOf('timeZone');
		timezoneOptions = timezones.map((zone) => {
			const offset = getTimezoneOffset(zone);
			const label = `${zone}`;
			return { value: zone, label, offset };
		});
	}

	// Automatically detect and set the user's timezone
	function detectUserTimezone() {
		const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const closestOption = timezoneOptions.find((option) => option.value === localTimezone);
		return closestOption || timezoneOptions[0]; // Default to the first option if not found
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	// Load the timezone options on mount
	loadTimezoneOptions();
	selectedTimezone = detectUserTimezone();

	let open = false;
	let value = detectUserTimezone();

	$: selectedValue = timezoneOptions.find((f) => f == value)?.label ?? 'Select a time zone...';
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class="w-full"
		>
			<div class="flex w-full flex-row items-center justify-between font-normal">
				<Earth class="h-4 w-4 text-slate-400" />

				{selectedValue}
				<div></div>
			</div>

			<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[300px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search time zone..." class="h-9" />
			<Command.Empty>No framework found.</Command.Empty>
			<Command.Group>
				<ScrollArea class="h-72 w-full rounded-md ">
					{#each timezoneOptions as timezone}
						<Command.Item
							value={timezone.value}
							onSelect={(currentValue) => {
								value = currentValue;
								open = !open;
							}}
						>
							<Check class={cn('mr-2 h-4 w-4', value !== timezone.value && 'text-transparent')} />
							{timezone.label}
						</Command.Item>
					{/each}
				</ScrollArea>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
