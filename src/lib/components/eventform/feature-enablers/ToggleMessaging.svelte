<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '../../ui/checkbox/checkbox.svelte';
	import { slide } from 'svelte/transition';
	import { MessagesSquare } from '@lucide/svelte';

	let { oninput, checked = $bindable<boolean>(false) } = $props();
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="enable-instant-messaging" bind:checked onclick={oninput} />
		<Label
			for="enable-instant-messaging"
			class="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			<MessagesSquare class="mx-1 h-5 w-5" /> Enable instant messaging
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input with Svelte Slide Transition -->
		<div
			transition:slide={{ duration: 300 }}
			class="mt-4 flex flex-col items-center space-y-3 overflow-hidden"
		>
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Let's you and your user message each other in one large group thread.
			</p>
		</div>
	{/if}
</div>
