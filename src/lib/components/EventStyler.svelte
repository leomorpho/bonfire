<script lang="ts">
	import { stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';

	let { finalStyleCss = $bindable<string>() } = $props();

	// Currently selected style
	let selectedStyle: { id: number; name: string; cssTemplate: string } | null = $state(null);

	// DOM reference to the injected style
	let styleElement: HTMLStyleElement | null = null;

	// Preview or final target
	let currentTargetSelector = 'bg-color-selector'; // Default to preview
	let finalTargetSelector = 'bg-color';

	/**
	 * Apply a selected style dynamically to the preview area.
	 * @param style - The selected style object.
	 * @param tempTargetSelector - The target selector to replace in the CSS.
	 */
	function applyStyle(
		style: { id: number; name: string; cssTemplate: string },
		tempTargetSelector: string,
		cleanup = true
	) {
		if (styleElement && cleanup) {
			// Remove the previously applied preview style
			document.head.removeChild(styleElement);
		}

		// Replace the placeholder selector with the actual target
		const finalCss = `.${tempTargetSelector} {${style.cssTemplate}}`
		finalStyleCss = style.cssTemplate;

		// Create a new <style> tag for the selected preview style
		styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = finalCss;
		document.head.appendChild(styleElement);

		// Update the selected style and target
		selectedStyle = style;
		currentTargetSelector = tempTargetSelector;
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

<div class="gallery w-full">
	<h2>Select a Style</h2>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each stylesGallery as style}
		<div class="h-40 bg-white bg-opacity-100 rounded-lg">
			<button
				class="h-full w-full max-w-full rounded-lg style-button-{style.id} select-bordered border-4 flex justify-center items-center"
				class:selected={selectedStyle?.id === style.id}
				style={style.cssTemplate}
				onclick={() => applyStyle(style, 'bg-color-selector')}
			>
			<div class="bg-white p-1 rounded-lg text-xs sm:text-sm">{style.name}</div>
				
			</button>
		</div>
		{/each}
	</div>
</div>
