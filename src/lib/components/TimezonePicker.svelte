<script lang="ts">
	import { tick } from 'svelte';

	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	import { Earth } from 'lucide-svelte';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	// Timezone data and selection
	let { value = $bindable() } = $props();

	let timezoneOptions: any = $state([]);

	// Helper function to get the UTC offset for a timezone in hours
	function getTimezoneOffset(timezone: string): number {
		const now = new Date();
		const dateInTimezone = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			timeZoneName: 'short'
		}).formatToParts(now);
		const offsetString = dateInTimezone.find((part) => part.type == 'timeZoneName')?.value || '';
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
		const closestOption = timezoneOptions.find((option: any) => option.value == localTimezone);
		return closestOption || timezoneOptions[0]; // Default to the first option if not found
	}

	// Load the timezone options on mount
	loadTimezoneOptions();

	let open = $state(false);

	let triggerRef = $state<HTMLButtonElement>(null!);
	value = detectUserTimezone();

	const selectedValue = $derived(
		timezoneOptions.find((f: any) => f.value == value.value)?.label ?? 'Select a time zone...'
	);

	$effect(() => {
		console.log(value);
	});

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef}>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="w-full justify-between"
				{...props}
				role="combobox"
				aria-expanded={open}
			>
				<div class="flex w-full flex-row items-center justify-between font-normal">
					<Earth class="h-4 w-4 text-slate-400" />
					{selectedValue || 'Select a time zone...'}
					<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
				</div>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="p-0 sm:w-[350px]">
		<Command.Root>
			<Command.Input placeholder="Search framework..." />
			<Command.List>
				<Command.Empty>No time zones found.</Command.Empty>
				<Command.Group>
					{#each timezoneOptions as timezone}
						<Command.Item
							value={timezone.value}
							onSelect={() => {
								value = timezone;
								closeAndFocusTrigger();
							}}
						>
							<Check class={cn('mr-2 size-4', value.value !== timezone.value && 'text-transparent')} />
							{timezone.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
