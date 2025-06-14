<script lang="ts">
	import { fontStore } from '$lib/styles';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let fontStyleElement: HTMLStyleElement | null = null;
	let fontLinkElement: HTMLLinkElement | null = null;

	/**
	 * Generate CSS for font size scaling that overrides Tailwind text size classes ONLY within bonfire event content
	 */
	function generateScopedFontSizeCSS(fontSize: number) {
		const tailwindTextSizes = {
			'text-xs': '0.75rem',
			'text-sm': '0.875rem',
			'text-base': '1rem',
			'text-lg': '1.125rem',
			'text-xl': '1.25rem',
			'text-2xl': '1.5rem',
			'text-3xl': '1.875rem',
			'text-4xl': '2.25rem',
			'text-5xl': '3rem',
			'text-6xl': '3.75rem',
			'text-7xl': '4.5rem',
			'text-8xl': '6rem',
			'text-9xl': '8rem'
		};

		// Scope all text size rules to bonfire event content only
		const scaleRules = Object.entries(tailwindTextSizes)
			.map(
				([className, size]) =>
					`.bonfire-event-content .${className} { font-size: calc(${size} * ${fontSize}); }`
			)
			.join('\n');

		// Base font size for event content
		const baseRule = `
			.bonfire-event-content { font-size: calc(1rem * ${fontSize}); }
		`;

		// Additional rules for prose content and HTML content within event descriptions
		const proseRules = `
			.bonfire-event-content .prose { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content .prose p { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content .prose h1 { font-size: calc(2.25rem * ${fontSize}); }
			.bonfire-event-content .prose h2 { font-size: calc(1.875rem * ${fontSize}); }
			.bonfire-event-content .prose h3 { font-size: calc(1.5rem * ${fontSize}); }
			.bonfire-event-content .prose h4 { font-size: calc(1.25rem * ${fontSize}); }
			.bonfire-event-content .prose h5 { font-size: calc(1.125rem * ${fontSize}); }
			.bonfire-event-content .prose h6 { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content .prose blockquote { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content .prose li { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content #pot-pourri { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content #pot-pourri * { font-size: inherit; }
		`;

		return `${baseRule}\n${scaleRules}\n${proseRules}`;
	}

	function applyFontStyles(font: any) {
		if (!browser) return;

		const fontElementId = 'global-font-style';
		const fontLinkId = 'global-font-link';

		// Remove existing font link
		const existingFontLink = document.getElementById(fontLinkId);
		if (existingFontLink && document.head.contains(existingFontLink)) {
			document.head.removeChild(existingFontLink);
		}

		// Remove existing font styles
		const existingFontStyle = document.getElementById(fontElementId);
		if (existingFontStyle && document.head.contains(existingFontStyle)) {
			document.head.removeChild(existingFontStyle);
		}

		if (!font) return;

		// Add font CDN link if available
		if (font.cdn) {
			fontLinkElement = document.createElement('link');
			fontLinkElement.id = fontLinkId;
			fontLinkElement.href = font.cdn;
			fontLinkElement.rel = 'stylesheet';
			document.head.appendChild(fontLinkElement);
		}

		// Apply font styles and size scaling
		const fontSize = font.fontSize || 1.0;
		const fontStyle = font.style || '';

		const fontSizeCSS = generateScopedFontSizeCSS(fontSize);

		const completeCss = `
			/* Font family and size scaling scoped to bonfire event content only */
			${fontStyle ? `.bonfire-event-content { ${fontStyle} }` : ''}
			
			/* Font size scaling for Tailwind text classes within event content */
			${fontSizeCSS}
		`;

		fontStyleElement = document.createElement('style');
		fontStyleElement.id = fontElementId;
		fontStyleElement.type = 'text/css';
		fontStyleElement.textContent = completeCss;
		document.head.appendChild(fontStyleElement);
	}

	onMount(() => {
		// Apply initial font styles
		const unsubscribe = fontStore.subscribe((font) => {
			applyFontStyles(font);
		});

		return () => {
			unsubscribe();

			// Cleanup on unmount
			if (fontStyleElement && document.head.contains(fontStyleElement)) {
				document.head.removeChild(fontStyleElement);
			}
			if (fontLinkElement && document.head.contains(fontLinkElement)) {
				document.head.removeChild(fontLinkElement);
			}
		};
	});
</script>

<!-- This component has no visible output, it only applies scoped styles to bonfire event content -->
