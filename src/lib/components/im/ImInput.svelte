<script lang="ts">
	import { Send, Smile } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import EmojiPicker from '../EmojiPicker.svelte';

	let { handleSendMessage, canSendIm = true } = $props();

	let message = $state(''); // Chat input state
	let textarea: HTMLTextAreaElement;
	let pickerInstance: any = null;

	const MAX_HEIGHT = 100; // Set max height in pixels

	const textInputPlaceholder = canSendIm ? 'Write a message...' : 'Temporary users can\'t interact. Please log in or sign up to participate.';

	// Adjust textarea height dynamically with a max height
	const adjustTextareaHeight = () => {
		if (textarea) {
			textarea.style.height = 'auto'; // Reset to auto to recalculate scrollHeight
			const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
			textarea.style.height = `${newHeight}px`;

			// Enable scrolling if max height is reached
			if (textarea.scrollHeight > MAX_HEIGHT) {
				textarea.style.overflowY = 'auto';
			} else {
				textarea.style.overflowY = 'hidden';
			}
		}
	};

	// Handle emoji selection
	const addEmoji = (detail: any) => {
		message += detail.unicode;

		// Move caret to the end
		requestAnimationFrame(() => {
			if (textarea) {
				textarea.focus();
				textarea.selectionStart = textarea.selectionEnd = message.length;
			}
		});
	};

	onMount(() => {
		adjustTextareaHeight();
	});

	onDestroy(() => {
		if (pickerInstance) pickerInstance.destroy();
	});
</script>

<div
	class="flex w-full items-center gap-3 rounded-b-xl bg-white bg-opacity-90 p-3 dark:bg-gray-900 dark:bg-opacity-90"
>
	<!-- Attachments Button -->
	<!-- <Button
		variant="ghost"
		size="icon"
		title="Attach File"
		class="focus:outline-none focus-visible:ring-0"
	>
		<Paperclip class="h-5 w-5 text-gray-500 dark:text-gray-400" />
	</Button> -->

	<!-- Text Input -->
	<div class="relative flex-grow">
		<textarea
			disabled={!canSendIm}
			bind:this={textarea}
			bind:value={message}
			oninput={adjustTextareaHeight}
			placeholder={textInputPlaceholder}
			rows="1"
			class="min-h-[40px] w-full resize-none rounded-lg bg-gray-100 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
		></textarea>
	</div>
	<!-- Emoji Picker Popover -->
	<Popover.Root>
		<Popover.Trigger class="focus:outline-none focus-visible:ring-0"
			><Smile
				class="h-5 w-5 text-gray-500 focus:outline-none focus-visible:ring-0 dark:text-gray-400"
			/></Popover.Trigger
		>
		<Popover.Content class="w-fit">
			<EmojiPicker handleEmojiSelect={addEmoji} />
		</Popover.Content>
	</Popover.Root>
	<!-- Send Message Button -->
	<Button
		variant="default"
		size="icon"
		title="Send Message"
		onclick={() => {
			handleSendMessage(message);
			console.log('Message Sent:', message);
			message = '';
			adjustTextareaHeight();
		}}
		class="focus:outline-none focus-visible:ring-0"
		disabled={message.length == 0 || !canSendIm}
	>
		<Send class="h-5 w-5 text-white dark:text-black" />
	</Button>
</div>
