<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import { onMount } from 'svelte';
	import type { FontSelection } from '$lib/types';
	import { Check, Type, Save } from 'lucide-svelte';
	import { Font } from '$lib/styles';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	// Initialize selectedFont as an object with name, style, and cdn properties
	let { selectedFont = $bindable<FontSelection | null>(null), onSelect } = $props();

	// Define the text to be displayed
	const sampleText = 'This bonfire event was the best ever.';

	// Font size state
	let fontSizeSlider = $state([1.0]);

	// Initialize font size slider when selected font changes
	$effect(() => {
		if (selectedFont) {
			// Ensure fontSize is set if not already present
			if (selectedFont.fontSize === undefined) {
				selectedFont.fontSize = 1.0;
			}
			fontSizeSlider = [selectedFont.fontSize];
		}
	});

	// Update selected font when slider changes (but don't auto-save)
	$effect(() => {
		if (selectedFont && fontSizeSlider[0] !== selectedFont.fontSize) {
			selectedFont.fontSize = fontSizeSlider[0];
			// Don't call onSelect() here to avoid immediate save
		}
	});

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
		const currentFontSize = selectedFont?.fontSize || 1.0;
		selectedFont = {
			name: fontName,
			style: fontStyle,
			cdn: fontCdn,
			fontSize: currentFontSize
		};
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
			style="{selectedFont.style} font-size: {(selectedFont.fontSize || 1.0) * 1.2}em;"
			class="font-sample w-full rounded-lg bg-blue-200 p-4 text-black dark:bg-blue-800 dark:text-white"
		>
			<div class="flex justify-center">
				<span class="text-green-600 dark:text-green-400"><Check /> </span>
				<strong>{selectedFont.name}</strong>
			</div>
			<div class="flex w-full justify-center">{sampleText}</div>
		</div>

		<!-- Font Size Control -->
		<div class="mt-4 rounded-lg bg-slate-200 p-4 dark:bg-slate-800">
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Type class="h-4 w-4" />
					<Label class="text-sm font-medium">
						Font Size: {Math.round((selectedFont.fontSize || 1.0) * 100)}%
					</Label>
				</div>
				<Button size="sm" variant="outline" onclick={() => onSelect()} class="h-7 px-2 text-xs">
					<Save class="mr-1 h-3 w-3" />
					Apply
				</Button>
			</div>
			<div class="flex items-center gap-3">
				<span class="text-xs text-gray-600 dark:text-gray-400">Smaller</span>
				<Slider bind:value={fontSizeSlider} min={0.5} max={2.0} step={0.1} class="flex-1" />
				<span class="text-xs text-gray-600 dark:text-gray-400">Larger</span>
			</div>
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
						style="{fontStyle} font-size: {(selectedFont?.fontSize || 1.0) * 1.2}em;"
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
