<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Earth } from 'lucide-svelte';

	// Options for timezones
	const timezoneOptions = [
		{ value: 'UTC', label: 'UTC (±00:00)' },
		{ value: 'GMT', label: 'UTC ±00:00 (GMT)' },
		{ value: 'CET', label: 'UTC +01:00 (CET)' },
		{ value: 'EET', label: 'UTC +02:00 (EET)' },
		{ value: 'FET', label: 'UTC +03:00 (FET)' },
		{ value: 'AST', label: 'UTC +03:00 (AST)' },
		{ value: 'GST', label: 'UTC +04:00 (GST)' },
		{ value: 'PKT', label: 'UTC +05:00 (PKT)' },
		{ value: 'IST', label: 'UTC +05:30 (IST)' },
		{ value: 'SLT', label: 'UTC +05:30 (SLT)' },
		{ value: 'BST', label: 'UTC +06:00 (BST)' },
		{ value: 'OMST', label: 'UTC +06:00 (OMST)' },
		{ value: 'ICT', label: 'UTC +07:00 (ICT)' },
		{ value: 'CST', label: 'UTC +08:00 (CST)' },
		{ value: 'AWST', label: 'UTC +08:00 (AWST)' },
		{ value: 'KST', label: 'UTC +09:00 (KST)' },
		{ value: 'JST', label: 'UTC +09:00 (JST)' },
		{ value: 'ACST', label: 'UTC +09:30 (ACST)' },
		{ value: 'AEST', label: 'UTC +10:00 (AEST)' },
		{ value: 'VLAT', label: 'UTC +10:00 (VLAT)' },
		{ value: 'ChST', label: 'UTC +10:00 (ChST)' },
		{ value: 'NZST', label: 'UTC +12:00 (NZST)' },
		{ value: 'FJT', label: 'UTC +12:00 (FJT)' },
		{ value: 'TOT', label: 'UTC +13:00 (TOT)' },
		{ value: 'KMT', label: 'UTC +14:00 (KMT)' }
	];

	let selectedTimezone = undefined;
</script>

<!-- Timezone Selector Dropdown -->
<Select.Root bind:value={selectedTimezone}>
	<Select.Trigger>
		<Earth class="ml-1 mr-1 h-4 w-4 text-slate-500" />
		<Select.Value placeholder="Select Timezone" />
	</Select.Trigger>
	<Select.Content>
		<ScrollArea class="h-72 w-full rounded-md ">
			<Select.Group>
				{#each timezoneOptions as timezone}
					<Select.Item value={timezone.value} label={timezone.label}>
						{timezone.label}
					</Select.Item>
				{/each}
			</Select.Group>
		</ScrollArea>
	</Select.Content>
</Select.Root>
