<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { SunMoon } from 'lucide-svelte';

	// Options for AM/PM
	const ampmOptions = [
		{ value: 'AM', label: 'AM' },
		{ value: 'PM', label: 'PM' }
	];

	export let selected = { value: 'PM', label: 'PM' }
</script>

<!-- AM/PM Selector Dropdown -->
<Select.Root bind:selected>
	<Select.Trigger class="w-full">
		<Select.Value placeholder="AM/PM" />
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
