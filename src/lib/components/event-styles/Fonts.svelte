<script lang="ts">
	import { Font } from '$lib/enums';
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import { onMount } from 'svelte';
	import type { FontSelection } from '$lib/types';

	// Initialize selectedFont as an object with name, style, and cdn properties
	let { selectedFont = $bindable<FontSelection | null>(null), onSelect } = $props();

	// Define the text to be displayed
	const sampleText = 'This bonfire event was the best ever.';

	// Load all fonts when the component is mounted
	onMount(() => {
		for (const { cdn } of Object.values(Font)) {
			const link = document.createElement('link');
			link.href = cdn;
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}
	});

	// Function to handle font selection
	const selectFont = (fontName: string, fontStyle: string, fontCdn: string) => {
		selectedFont = { name: fontName, style: fontStyle, cdn: fontCdn };
		onSelect();
	};

	$inspect(selectedFont);
</script>

<div class="h-[90vh] sm:h-[80vh]">
	<ScrollArea class="h-full">
		{#each Object.entries(Font) as [fontName, { style: fontStyle, cdn: fontCdn }]}
			<button
				class="font-sample w-full rounded-lg bg-slate-200 p-4 text-black transition-all duration-200 hover:bg-green-100 dark:bg-slate-800 dark:text-white dark:hover:bg-green-800"
				style={fontStyle}
				onclick={() => selectFont(fontName, fontStyle, fontCdn)}
			>
				<div class="mb-2"><strong>{fontName}</strong></div>
				{sampleText}
			</button>
		{/each}
	</ScrollArea>
</div>

<style>
	.font-sample {
		margin: 10px 0;
		font-size: 1.2em;
	}
</style>
