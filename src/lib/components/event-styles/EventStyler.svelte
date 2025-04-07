<script lang="ts">
	import { parseColor, randomSort, stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { PaintRoller } from 'lucide-svelte';
	import { dev } from '$app/environment';
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
	import FontsDialog from './FontsDialog.svelte';
	import type { FontSelection } from '$lib/types';

	let {
		finalStyleCss = $bindable<string>(),
		overlayColor = $bindable<string>(),
		overlayOpacity = $bindable<number>(),
		font = $bindable<FontSelection | null>(null),
		currentTargetSelector = 'bg-color-selector',
		bgOverlaySelector = 'bg-overlay-selector',
		horizontalScroll = false
	} = $props();

	// Currently selected style
	let selectedStyle: { id: number; name: string; cssTemplate: string } | null = $state(null);

	const randomStylesGallery = randomSort(stylesGallery);
	// DOM reference to the injected style
	let styleElement: HTMLStyleElement | null = null;

	let overlayForShadnSlider = $state([overlayOpacity]);

	$effect(() => {
		overlayOpacity = overlayForShadnSlider[0];
		applyStyle();
	});

	/**
	 * Apply a selected style dynamically to the preview area.
	 * @param style - The selected style object.
	 */
	function applyStyle(
		style: { id: number; name: string; cssTemplate: string } | null = null,
		cleanup = true
	) {
		const fontStyle = font ? font.style : '';
		finalStyleCss = `${fontStyle} ${style?.cssTemplate ?? ''}`.trim();

		if (styleElement && cleanup) {
			// Remove the previously applied preview style
			document.head.removeChild(styleElement);
		}

		// Add the font CDN link to the document head if a font is selected
		if (font && font.cdn) {
			const fontLink = document.createElement('link');
			fontLink.href = font.cdn;
			fontLink.rel = 'stylesheet';
			document.head.appendChild(fontLink);
		}

		// Replace the placeholder selector with the actual target
		const completeCss = `
		.${currentTargetSelector} {
			${finalStyleCss}
		}

		.${bgOverlaySelector} {
				background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});
			}
		`;

		if (dev) {
			console.log('applying css', completeCss);
		}

		// Create a new <style> tag for the selected preview style
		styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = completeCss;
		document.head.appendChild(styleElement);

		// Update the selected style and target
		selectedStyle = style;
	}

	// DOM references for button-specific styles
	let buttonStyleElements: Record<number, HTMLStyleElement> = {};

	/**
	 * Apply a style dynamically to a button.
	 * @param style - The style object for the button.
	 * @param buttonId - The unique button ID.
	 */
	function applyButtonStyle(
		style: { id: number; name: string; cssTemplate: string },
		buttonId: number
	) {
		// Remove existing style for the button, if any
		if (buttonStyleElements[buttonId]) {
			document.head.removeChild(buttonStyleElements[buttonId]);
			delete buttonStyleElements[buttonId];
		}

		// Replace the `{selector}` placeholder with the button-specific selector
		const finalCss = style.cssTemplate.replace(/{selector}/g, `style-button-${buttonId}`);

		// Create a new `<style>` tag for the button
		const buttonStyleElement = document.createElement('style');
		buttonStyleElement.type = 'text/css';
		buttonStyleElement.textContent = finalCss;
		document.head.appendChild(buttonStyleElement);

		// Store the style element for cleanup later
		buttonStyleElements[buttonId] = buttonStyleElement;
	}

	function clearOverlay() {
		overlayForShadnSlider[0] = 0;
		applyStyle();
	}

	/**
	 * Apply styles to all buttons on load.
	 */
	function applyStylesToButtons() {
		stylesGallery.forEach((style) => {
			applyButtonStyle(style, style.id);
		});
	}

	// Initial setup (no style applied by default)
	onMount(() => {
		// console.log('CREATE/UPDATE mode defaults:', { finalStyleCss, overlayColor, overlayOpacity });
		applyStyle(); // Apply styles explicitly
		applyStylesToButtons();
	});
</script>

<div class="sticky top-10 mx-2 flex justify-center">
	<div class="flex max-w-96 space-x-2">
		<Popover.Root>
			<Popover.Trigger class="mt-3 flex w-1/2 justify-center sm:w-[450px]">
				<Button
					class="h-10 w-full ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
				>
					<PaintRoller class="mr-1" />
					Overlay
				</Button>
			</Popover.Trigger>
			<Popover.Content class="bg-slate-200 dark:bg-slate-800 dark:text-white">
				<div class="flex w-full justify-center">Overlay</div>
				<div class="mt-7 flex w-full items-center justify-center space-x-5">
					<div class="mb-4 flex items-center justify-center">
						<input
							type="color"
							bind:value={overlayColor}
							class="mt-1 block h-10 w-10 rounded-md border border-gray-300"
							oninput={() => applyStyle()}
						/>
					</div>

					<div class="mb-4 flex w-full flex-col items-center">
						<label
							for="overlay-opacity"
							class="my-4 block text-sm font-medium text-gray-700 dark:text-slate-100"
							>Opacity: {Math.round(overlayOpacity * 100)}%</label
						>

						<Slider
							bind:value={overlayForShadnSlider}
							min={0}
							max={1}
							step={0.001}
							oninput={() => applyStyle()}
						/>
					</div>
				</div>
				<Button class="mt-3 w-full" onclick={clearOverlay}>Clear</Button>
			</Popover.Content>
		</Popover.Root>

		<FontsDialog bind:font onSelect={() => applyStyle()} />
	</div>
</div>

{#snippet galleryStyle(style: any)}
	<button
		class="h-full w-full max-w-full rounded-lg style-button-{style.id} select-bordered flex items-center justify-center border-4"
		class:selected={selectedStyle?.id === style.id}
		style={style.cssTemplate}
		onclick={() => applyStyle(style)}
	>
		<div
			class="rounded-lg bg-white p-1 text-xs dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:text-sm"
		>
			{style.name}
		</div>
	</button>
{/snippet}

<div class="gallery my-5 h-full">
	<div
		class={`${horizontalScroll ? 'flex h-full' : 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'}`}
	>
		{#if horizontalScroll}
			<ScrollArea
				id="scroll-container"
				orientation="horizontal"
				class="h-full w-screen flex-row whitespace-nowrap"
			>
				<div class="flex h-full w-max space-x-4 p-4">
					{#each randomStylesGallery as style}
						<div class="h-full w-40 rounded-lg bg-white bg-opacity-100">
							{@render galleryStyle(style)}
						</div>
					{/each}
				</div>
			</ScrollArea>
		{:else}
			{#each randomStylesGallery as style}
				<div class="h-40 rounded-lg bg-white bg-opacity-100">
					{@render galleryStyle(style)}
				</div>
			{/each}
		{/if}
	</div>
</div>
