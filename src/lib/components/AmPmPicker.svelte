<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { SunMoon } from 'lucide-svelte';

	// Options for AM/PM
	const ampmOptions = [
		{ value: 'AM', label: 'AM' },
		{ value: 'PM', label: 'PM' }
	];

	let selectedAMPM: any = undefined;
</script>

<!-- AM/PM Selector Dropdown -->
<Select.Root bind:value={selectedAMPM}>
	<Select.Trigger class="w-[180px]">
		<SunMoon class="ml-1 mr-1 h-4 w-4 text-slate-500" />
		<Select.Value placeholder="Select AM/PM" />
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each ampmOptions as option}
				<Select.Item value={option.value} label={option.label}>
					{option.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
