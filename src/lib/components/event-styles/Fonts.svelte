<script lang="ts">
	import { Font } from '$lib/enums';
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import { onMount } from 'svelte';

	let { selectedFont = '' } = $props();

	// Define the text to be displayed
	const sampleText = 'The quick brown fox jumps over the lazy dog.';

	// Load all fonts when the component is mounted
	onMount(() => {
		for (const { cdn } of Object.values(Font)) {
			const link = document.createElement('link');
			link.href = cdn;
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		}
	});
</script>

<div class="h-[90vh] sm:h-[80vh]">
	<ScrollArea class="h-full">
		{#each Object.entries(Font) as [fontName, { style: fontStyle }]}
			<button
				class="font-sample w-full rounded-lg bg-slate-200 p-4 text-black hover:bg-slate-100 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
				style={fontStyle}
				onclick={() => (selectedFont = fontName)}
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
