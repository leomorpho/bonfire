<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import { Images } from 'lucide-svelte';
	import Checkbox from '../../ui/checkbox/checkbox.svelte';
	import { slide } from 'svelte/transition';

	let { oninput, checked = $bindable<boolean>(false) } = $props();
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="enable-gallery" bind:checked onclick={oninput} />
		<Label
			for="enable-gallery"
			class="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			<Images class="mx-1 h-5 w-5" /> Enable gallery
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input with Svelte Slide Transition -->
		<div
			transition:slide={{ duration: 300 }}
			class="mt-4 flex flex-col items-center space-y-3 overflow-hidden"
		>
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Let users upload media files like pictures and videos to your event gallery.
			</p>
		</div>
	{/if}
</div>
