<script lang="ts">
	import type { DateValue } from '@internationalized/date';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { onMount } from 'svelte';

	let {
		oninput,
		class: cls = null,
		value = $bindable<DateValue | undefined>(),
		placeholder,
		disabled = false,
		maxLength = null
	} = $props();

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

	// Function to determine the character limit based on encoding
	function getCharacterLimit(text: string, maxLength: number): number {
		// Check if the text contains any non-GSM-7 characters
		const hasNonGsmCharacters = /[^\x00-\x7F]/.test(text);

		if (hasNonGsmCharacters) {
			// Calculate the effective length considering Unicode characters
			let effectiveLength = 0;
			for (const char of text) {
				// Emojis and some special characters are represented by surrogate pairs
				effectiveLength += char.codePointAt(0)! > 0xffff ? 2 : 1;
			}
			return Math.floor(maxLength / 2) - (effectiveLength - text.length);
		}

		return maxLength;
	}

	// Function to handle input changes
	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		if (maxLength !== null && target.value.length > maxLength) {
			const limit = getCharacterLimit(target.value, maxLength);
			if (target.value.length > limit) {
				target.value = target.value.slice(0, limit);
			}
		}
		autoGrow(event);
		oninput?.(event);
	}
	let remainingCharacters = $derived(maxLength !== null ? maxLength - value.length : null);
</script>

<div class="relative ">
	AAAA
	<Textarea
		class={`resize-none ${cls}`}
		{placeholder}
		bind:value
		oninput={handleInput}
		{disabled}
		maxlength={maxLength}
	/>
	{#if maxLength !== null}
		<span class="absolute bottom-1 right-2 text-xs text-gray-500">
			{remainingCharacters}/{maxLength}
		</span>
	{/if}
</div>
