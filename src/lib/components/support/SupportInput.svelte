<script lang="ts">
	import { Send } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	let {
		handleSendMessage,
		disabled = false,
		placeholder = 'Type your message...'
	} = $props<{
		handleSendMessage: (message: string) => void;
		disabled?: boolean;
		placeholder?: string;
	}>();

	let message = $state(''); // Chat input state
	let textarea: HTMLTextAreaElement;

	const MAX_HEIGHT = 100; // Set max height in pixels

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

	const sendMessage = () => {
		const trimmedMessage = message.trim();
		if (trimmedMessage && !disabled) {
			handleSendMessage(trimmedMessage);
			message = '';
			// Reset textarea height after sending
			requestAnimationFrame(() => {
				adjustTextareaHeight();
			});
		}
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	};

	onMount(() => {
		adjustTextareaHeight();
	});
</script>

<div
	class="flex w-full items-end gap-3 rounded-b-xl bg-white bg-opacity-90 p-4 dark:bg-gray-900 dark:bg-opacity-90"
>
	<!-- Text Input -->
	<div class="relative flex-grow">
		<textarea
			bind:this={textarea}
			bind:value={message}
			oninput={adjustTextareaHeight}
			onkeydown={handleKeyDown}
			{placeholder}
			{disabled}
			rows="1"
			class="min-h-[40px] w-full resize-none rounded-lg bg-gray-100 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100"
		></textarea>
	</div>

	<!-- Send Message Button -->
	<Button
		variant="default"
		size="icon"
		title="Send Message"
		onclick={sendMessage}
		disabled={disabled || !message.trim()}
		class="flex-shrink-0"
	>
		<Send class="h-4 w-4" />
	</Button>
</div>
