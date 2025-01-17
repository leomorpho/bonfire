<script lang="ts">
	import type { DateValue } from '@internationalized/date';
	import { Textarea } from '$lib/components/ui/textarea/index.js';

	let { cls, value = $bindable<DateValue | undefined>(), placeholder } = $props();

	// Function to adjust the height dynamically
	function autoGrow(event) {
		const textarea = event.target;
		textarea.style.height = 'auto'; // Reset height to recalculate
		textarea.style.height = `${textarea.scrollHeight + 5}px`; // Set height to match content
	}
</script>

<Textarea class={`resize-none ${cls}`} {placeholder} bind:value oninput={autoGrow} />
