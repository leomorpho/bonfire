<script lang="ts">
	import type { DateValue } from '@internationalized/date';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { onMount } from 'svelte';

	let { cls, value = $bindable<DateValue | undefined>(), placeholder } = $props();

	// Function to adjust the height dynamically
	function autoGrow(event) {
		const textarea = event.target;
		textarea.style.height = 'auto'; // Reset height to recalculate
		textarea.style.height = `${textarea.scrollHeight + 5}px`; // Set height to match content
	}

	// Function to initialize height adjustment
	function initializeAutoGrow() {
		const textarea = document.querySelector('textarea');
		if (textarea) {
			textarea.style.height = 'auto'; // Reset height to recalculate
			textarea.style.height = `${textarea.scrollHeight + 5}px`; // Set height to match content
		}
	}

	// Call initialization on mount
	onMount(() => {
		initializeAutoGrow();
	});
</script>

<Textarea class={`resize-none ${cls}`} {placeholder} bind:value oninput={autoGrow} />
