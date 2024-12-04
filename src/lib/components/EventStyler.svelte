<script lang="ts">
	import { stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';

	// Currently selected style
	let selectedStyle: { id: number; name: string; cssTemplate: string } | null = null;

	// DOM reference to the injected style
	let styleElement: HTMLStyleElement | null = null;

	// Preview or final target
	let currentTargetSelector = 'bg-color-selector'; // Default to preview

	/**
	 * Apply a selected style dynamically.
	 * @param style - The selected style object.
	 * @param targetSelector - The target selector to replace in the CSS.
	 */
	function applyStyle(
		style: { id: number; name: string; cssTemplate: string },
		targetSelector: string
	) {
		if (styleElement) {
			// Remove the previously applied style
			document.head.removeChild(styleElement);
		}

		// Replace the placeholder selector with the actual target
		const finalCss = style.cssTemplate.replace(/{selector}/g, targetSelector);

		// Create a new <style> tag for the selected style
		styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.textContent = finalCss;
		document.head.appendChild(styleElement);

		// Update the selected style and target
		selectedStyle = style;
		currentTargetSelector = targetSelector;
	}

	/**
	 * Clear the applied style.
	 */
	function clearStyle() {
		if (styleElement) {
			document.head.removeChild(styleElement);
			styleElement = null;
		}
		selectedStyle = null;
		currentTargetSelector = 'bg-color-selector';
	}

	// Initial setup (no style applied by default)
	onMount(() => {
		clearStyle();
	});
</script>

<div class="gallery">
	<h2>Select a Style</h2>
	<div class="gallery-items">
		{#each stylesGallery as style}
			<button
				class="style-button"
				class:selected={selectedStyle?.id === style.id}
				on:click={() => applyStyle(style, 'bg-color-selector')}
			>
				{style.name}
			</button>
		{/each}
	</div>
	{#if selectedStyle}
		<div class="selected-style">
			<h3>Currently Applied Style: {selectedStyle.name}</h3>
			<button on:click={() => applyStyle(selectedStyle, 'bg-color')}
				>Apply to Final Container</button
			>
			<button on:click={clearStyle}>Clear Style</button>
		</div>
	{/if}
</div>
