<script lang="ts">
	import { Paperclip, Send, Smile } from "lucide-svelte";
	import { writable } from "svelte/store";
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button"; 
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover"; 
	// import "emoji-picker-element"; 

	let message = writable(""); // Chat input state
	let textarea: HTMLTextAreaElement;
	let emojiPicker: any;
    const MAX_HEIGHT = 100; // Set max height in pixels

	// Adjust textarea height dynamically with a max height
	const adjustTextareaHeight = () => {
		if (textarea) {
			textarea.style.height = "auto"; // Reset to auto to recalculate scrollHeight
			const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT);
			textarea.style.height = `${newHeight}px`;

			// Enable scrolling if max height is reached
			if (textarea.scrollHeight > MAX_HEIGHT) {
				textarea.style.overflowY = "auto";
			} else {
				textarea.style.overflowY = "hidden";
			}
		}
	};

	// Handle emoji selection
	const addEmoji = (event: CustomEvent) => {
		message.update((m) => m + event.detail.unicode);
	};

	onMount(() => {
		adjustTextareaHeight();
	});
</script>

<div class="w-full bg-white dark:bg-gray-900 p-3 flex items-center gap-3 rounded-b-xl">
	<!-- Attachments Button -->
	<Button variant="ghost" size="icon" title="Attach File">
		<Paperclip class="w-5 h-5 text-gray-500 dark:text-gray-400" />
	</Button>

	<!-- Text Input -->
	<div class="relative flex-grow">
		<textarea
			bind:this={textarea}
			bind:value={$message}
			on:input={adjustTextareaHeight}
			placeholder="Write a message..."
			rows="1"
			class="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
		></textarea>

		<!-- Emoji Picker Popover -->
        <!-- <emoji-picker></emoji-picker> -->

		<!-- <Popover>
			<PopoverTrigger >
				<Button variant="ghost" size="icon" class="absolute right-2 bottom-2">
					<Smile class="w-5 h-5 text-gray-500 dark:text-gray-400" />
				</Button>
			</PopoverTrigger>
			<PopoverContent class="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-md">
				<emoji-picker bind:this={emojiPicker} @emoji-click={addEmoji}></emoji-picker>
			</PopoverContent>
		</Popover> -->
	</div>

	<!-- Send Message Button -->
	<Button
		variant="default"
		size="icon"
		title="Send Message"
		onclick={() => {
			console.log("Message Sent:", $message);
			message.set("");
			adjustTextareaHeight();
		}}
	>
		<Send class="w-5 h-5 text-white dark:text-black" />
	</Button>
</div>
