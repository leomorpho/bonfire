<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser, dev } from '$app/environment';

	let { handleEmojiSelect } = $props();

	let emojiPicker: HTMLElement;

	// Initialize Emoji Picker
	async function initEmojiPicker() {
		if (browser) {
			await import('emoji-picker-element');

			// Attach event listener to the existing emoji picker element
			if (emojiPicker) {
				emojiPicker.addEventListener('emoji-click', (event: Event) => {
					const customEvent = event as CustomEvent;
					if (dev) {
						console.log('Emoji Selected:', customEvent.detail);
					}
					handleEmojiSelect(customEvent.detail);
				});
			}
		}
	}

	onMount(() => {
		initEmojiPicker();
	});

	onDestroy(() => {
		// Cleanup event listener
		if (emojiPicker) {
			try {
				emojiPicker?.removeEventListener('emoji-click', handleEmojiSelect);
			} catch (e) {
				console.log('failed to remove event listener', e);
			}
		}
	});
</script>

<!-- Attach to the existing emoji-picker -->
<emoji-picker class="dark" bind:this={emojiPicker}></emoji-picker>

<style>
	emoji-picker {
		--num-columns: 7;
		height: 20rem; /* Adjust this to control the number of visible rows */
		--emoji-padding: 0.3rem; /* Reduce spacing between emojis */
		--emoji-size: 1.6rem; /* Adjust emoji size if needed */
		--border-size: 0;
		--border-color: transparent;
	}
</style>
