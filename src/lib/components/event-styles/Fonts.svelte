<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import { onMount } from 'svelte';
	import type { FontSelection } from '$lib/types';
	import { Check } from 'lucide-svelte';
	import { Font } from '$lib/styles';
	import * as Command from '$lib/components/ui/command/index.js';

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

	// Create a sorted list of fonts, excluding the selected font
	let sortedFonts: Array<FontSelection> | null = $state(null);
	$effect(() => {
		sortedFonts = Object.entries(Font)
			.filter(([fontName]) => fontName !== selectedFont?.name)
			.sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
	});
</script>

<div>
	{#if selectedFont}
		<div
			style={selectedFont.style}
			class="font-sample w-full rounded-lg bg-blue-200 p-4 text-black dark:bg-blue-800 dark:text-white"
		>
			<div class="flex justify-center">
				<span class="text-green-600 dark:text-green-400"><Check /> </span>
				<strong>{selectedFont.name}</strong>
			</div>
			<div class="flex w-full justify-center">{sampleText}</div>
		</div>
	{/if}
	<Command.Root>
		<Command.Input placeholder="Search font..." class="mt-3 h-9" />
		<Command.List>
			<Command.Empty>No fonts found.</Command.Empty>
			<Command.Group>
				{#each sortedFonts as [fontName, { style: fontStyle, cdn: fontCdn }]}
					<Command.Item
						class="font-sample my-2 flex w-full flex-col rounded-lg bg-slate-200 p-2 text-black transition-all duration-200 hover:bg-green-100 dark:bg-slate-800 dark:text-white dark:hover:bg-green-800"
						value={fontName}
						style={fontStyle}
						onSelect={() => selectFont(fontName, fontStyle, fontCdn)}
					>
						<div class="mb-1"><strong>{fontName}</strong></div>
						{sampleText}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.List>
	</Command.Root>
</div>

<style>
	.font-sample {
		margin: 10px 0;
		font-size: 1.2em;
	}
</style>
