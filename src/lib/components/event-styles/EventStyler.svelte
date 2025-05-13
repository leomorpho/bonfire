<script lang="ts">
	import { fontStore, parseColor, randomSort, stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { PaintRoller } from 'lucide-svelte';
	import { dev } from '$app/environment';
	import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
	import FontsDialog from './FontsDialog.svelte';
	import type { FontSelection } from '$lib/types';
	import { getFeHttpTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let {
		eventId = null,
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
		applyStyle(true);
	});

	/**
	 * Apply a selected style dynamically to the preview area.
	 * @param style - The selected style object.
	 */
	function applyStyle(
		setNewStyle = false,
		style: { id: number; name: string; cssTemplate: string } | null = null
	) {
		const fontStyle = font ? font.style : '';
		finalStyleCss = style?.cssTemplate ?? finalStyleCss;
		const styleElementId = 'dynamic-preview-style'; // Specific ID for the style element
		const fontElementId = 'dynamic-preview-font'; // Specific ID for the font element

		// Remove any existing style element with the same ID if it is a child of the head
		const existingFontElement = document.getElementById(fontElementId);
		if (existingFontElement && document.head.contains(existingFontElement)) {
			document.head.removeChild(existingFontElement);
		}

		// Add the font CDN link to the document head if a font is selected
		if (font && font.cdn) {
			const fontLink = document.createElement('link');
			fontLink.id = fontElementId;
			fontLink.href = font.cdn;
			fontLink.rel = 'stylesheet';
			document.head.appendChild(fontLink);
		}

		// Replace the placeholder selector with the actual target
		const completeCss = `
			.${currentTargetSelector} {
				${fontStyle}
				${finalStyleCss}
			}

			.${bgOverlaySelector} {
					background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});
				}
		`;

		if (dev) {
			console.log('applying css', completeCss);
		}

		// Remove any existing style element with the same ID if it is a child of the head
		const existingStyleElement = document.getElementById(styleElementId);
		if (existingStyleElement && document.head.contains(existingStyleElement)) {
			document.head.removeChild(existingStyleElement);
		}

		// Create a new <style> tag for the selected preview style
		styleElement = document.createElement('style');
		styleElement.id = styleElementId; // Assign the specific ID
		styleElement.type = 'text/css';
		styleElement.textContent = completeCss;
		document.head.appendChild(styleElement);

		// Update the selected style and target
		selectedStyle = style;

		if (setNewStyle) {
			updateEvent(eventId);
			fontStore.set(font);
		}
	}

	const notifyStyleChangesApplied = () => {
		// Dismiss all existing toasts
		toast.dismiss();

		toast.success('Style changes saved!', { duration: 1500 });
	};

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
		applyStyle(true);
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

	const updateEvent = async (eventId: string) => {
		if (!eventId) {
			return;
		}
		try {
			const feHttpClient = getFeHttpTriplitClient($page.data.jwt);
			await feHttpClient.update('events', eventId, async (entity) => {
				entity.style = finalStyleCss;
				entity.overlay_color = overlayColor;
				entity.overlay_opacity = overlayOpacity;
				entity.font = JSON.stringify(font) || null;
			});

			console.log('🔄 Event updated successfully');
		} catch (error) {
			console.error('❌ Error updating event:', error);
		}
	};
</script>

<h1
	class="mb-2 flex w-full justify-center rounded-xl bg-white p-2 text-lg font-semibold dark:bg-slate-900 dark:text-white"
>
	Styles
</h1>
<div class="sticky top-16 mx-2">
	<div class="flex justify-center">
		<div class="flex max-w-96 space-x-2">
			<Popover.Root>
				<Popover.Trigger class="mt-3 flex w-1/2 justify-center sm:w-[450px]">
					<Button
						id="edit-overlay"
						class="h-10 w-full bg-rose-600 ring-glow hover:bg-rose-500 dark:bg-rose-900 dark:text-white dark:hover:bg-rose-800"
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
								oninput={() => {
									applyStyle(true);
									notifyStyleChangesApplied();
								}}
							/>
						</div>

						<div class="mb-4 flex w-full flex-col items-center">
							<label
								for="overlay-opacity"
								class="my-4 block text-sm font-medium text-gray-700 dark:text-slate-100"
								>Opacity: {Math.round(overlayOpacity * 100)}%</label
							>

							<Slider bind:value={overlayForShadnSlider} min={0} max={1} step={0.001} />
						</div>
					</div>
					<Button
						class="mt-3 w-full"
						onclick={() => {
							clearOverlay();
							notifyStyleChangesApplied();
						}}>Clear</Button
					>
				</Popover.Content>
			</Popover.Root>

			<FontsDialog
				bind:font
				onSelect={() => {
					applyStyle(true);
					notifyStyleChangesApplied();
				}}
			/>
		</div>
	</div>
</div>

{#snippet galleryStyle(style: any)}
	<button
		class="h-full w-full max-w-full rounded-lg style-button-{style.id} select-bordered flex items-center justify-center border-4"
		class:selected={selectedStyle?.id === style.id}
		style={style.cssTemplate}
		onclick={() => {
			applyStyle(true, style);
			notifyStyleChangesApplied();
		}}
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
		class={`${horizontalScroll ? 'flex h-full' : 'grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-4 lg:grid-cols-3'}`}
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
