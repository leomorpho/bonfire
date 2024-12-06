<script lang="ts">
	import { parseColor, stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';

	let {
		finalStyleCss = $bindable<string>(),
		overlayColor = $bindable<string>('#000000'),
		overlayOpacity = $bindable<number>(0.5)
	} = $props();

	// Currently selected style
	let selectedStyle: { id: number; name: string; cssTemplate: string } | null = $state(null);

	// DOM reference to the injected style
	let styleElement: HTMLStyleElement | null = null;

	// Preview or final target
	let currentTargetSelector = 'bg-color-selector'; // Default to preview
	let bgOverlaySelector = 'bg-overlay';

	/**
	 * Apply a selected style dynamically to the preview area.
	 * @param style - The selected style object.
	 */
	function applyStyle(
		style: { id: number; name: string; cssTemplate: string } | null = null,
		cleanup = true
	) {
		// TODO: is cleanup necessary? It introduces bugs that I need to fix....
		// if (styleElement && cleanup) {
		// 	// Remove the previously applied preview style
		// 	document.head.removeChild(styleElement);
		// }

		let currentStyle = style ?? selectedStyle;

		// Replace the placeholder selector with the actual target
		const finalCss = `
		.${currentTargetSelector} {${currentStyle?.cssTemplate}}

		.${bgOverlaySelector} {
				background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});
			}
		`;

		finalStyleCss = style?.cssTemplate;

		// Create a new <style> tag for the selected preview style
		styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = finalCss;
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

	/**
	 * Clear the preview style.
	 */
	function clearStyle() {
		if (styleElement) {
			document.head.removeChild(styleElement);
			styleElement = null;
		}
		selectedStyle = null;
		currentTargetSelector = 'bg-color-selector';
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
		applyStylesToButtons();
		clearStyle();
	});
</script>

<div class="flex items-center justify-center space-x-3">
	<div class="mb-4">
		<label for="overlay-color" class="block text-sm font-medium text-gray-700">Overlay Color</label>
		<input
			id="overlay-color"
			type="color"
			bind:value={overlayColor}
			class="mt-1 block h-10 w-full rounded-md border border-gray-300"
			oninput={() => applyStyle()}
		/>
	</div>

	<div class="mb-4 flex flex-col items-center">
		<label for="overlay-opacity" class="block text-sm font-medium text-gray-700"
			>Overlay Opacity</label
		>
		<input
			id="overlay-opacity"
			type="range"
			min="0"
			max="1"
			step="0.001"
			bind:value={overlayOpacity}
			class="mt-1 block w-full"
			oninput={() => applyStyle()}
		/>
		<span class="text-sm text-gray-500">Current: {Math.round(overlayOpacity * 100)}%</span>
	</div>
</div>

<div class="gallery mt-5 w-full">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each stylesGallery as style}
			<div class="h-40 rounded-lg bg-white bg-opacity-100">
				<button
					class="h-full w-full max-w-full rounded-lg style-button-{style.id} select-bordered flex items-center justify-center border-4"
					class:selected={selectedStyle?.id === style.id}
					style={style.cssTemplate}
					onclick={() => applyStyle(style)}
				>
					<div class="rounded-lg bg-white p-1 text-xs sm:text-sm">{style.name}</div>
				</button>
			</div>
		{/each}
	</div>
</div>
