<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	// Bindable properties
	let {
		oninput = null,
		value = $bindable<string>(),
		styleClass = 'bg-white',
		maxValue = 59,
		minValue = 0,
		placeholder = 'HH',
		disabled = false
	} = $props();
	let inputRef: HTMLInputElement | null = null; // Reference for the input element

	// Validate the input value
	function validateValue(inputValue: string): string {
		// Only allow digits
		inputValue = inputValue.replace(/[^\d]/g, '');

		// Ensure it's not longer than 2 digits
		inputValue = inputValue.slice(0, 2);

		// Check against min/max values if we have a number
		if (inputValue) {
			const numericValue = parseInt(inputValue, 10);
			if (numericValue > maxValue) {
				return maxValue.toString();
			}
			if (numericValue < minValue) {
				return minValue.toString();
			}
		}
		return inputValue;
	}

	// Ensure value stays validated on updates
	$effect(() => {
		value = validateValue(value);
	});

	// Add leading zero if necessary on blur
	function handleBlur() {
		value = value.padStart(2, '0');
	}
</script>

<!-- Two-digit input field with max value -->
<Input
	type="text"
	bind:value
	pattern="[0-9]*"
	inputmode="numeric"
	{placeholder}
	class={`md:w-18 w-12 text-center dark:bg-slate-900 sm:w-16 ${styleClass}`}
	onblur={() => handleBlur()}
	{oninput}
	{disabled}
/>
