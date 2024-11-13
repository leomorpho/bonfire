<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	// Bindable properties
	let { value = $bindable<string>(), maxValue = 59, placeholder = 'HH' } = $props();
	let inputRef: HTMLInputElement | null = null; // Reference for the input element

	// Validate the input value
	function validateValue(inputValue: string): string {
		// Only allow digits
		inputValue = inputValue.replace(/[^\d]/g, '');

		// Ensure it's not longer than 2 digits
		inputValue = inputValue.slice(0, 2);

		// Check against maxValue if we have a number
		if (inputValue) {
			const numericValue = parseInt(inputValue, 10);
			if (numericValue > maxValue) {
				return maxValue.toString();
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
	class="w-16 text-center"
	onblur={() => handleBlur()}
/>
