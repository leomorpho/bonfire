<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	let { oninput, onValueChange = $bindable(() => {}), styleClass="bg-white dark:bg-slate-900" } = $props();

	// Options for AM/PM
	const ampmOptions = [
		{ value: 'AM', label: 'AM' },
		{ value: 'PM', label: 'PM' }
	];

	let value = $state('PM');

	const triggerContent = $derived(
		ampmOptions.find((f) => f.value === value)?.label ?? 'Select a fruit'
	);

	$effect(() => onValueChange(value));
</script>

<Select.Root type="single" name="am/pm" bind:value {oninput}>
	<Select.Trigger class={`w-full  ${styleClass}`}>
		{triggerContent}
	</Select.Trigger>
	<Select.Content class={styleClass}>
		<Select.Group>
			{#each ampmOptions as option}
				<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
