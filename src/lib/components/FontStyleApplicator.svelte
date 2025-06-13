<script lang="ts">
	import { fontStore } from '$lib/styles';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let fontStyleElement: HTMLStyleElement | null = null;
	let fontLinkElement: HTMLLinkElement | null = null;

	/**
	 * Generate CSS for font size scaling that overrides all Tailwind text size classes globally
	 */
	function generateGlobalFontSizeCSS(fontSize: number) {
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

		const scaleRules = Object.entries(tailwindTextSizes)
			.map(([className, size]) => 
				`.${className} { font-size: calc(${size} * ${fontSize}) !important; }`
			)
			.join('\n');

		// Also scale the base font size for event content (more specific targeting)
		const baseRule = `
			.bonfire-event-content { font-size: calc(1rem * ${fontSize}); }
			.bonfire-event-content * { font-size: inherit; }
		`;

		return `${baseRule}\n${scaleRules}`;
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
		
		const fontSizeCSS = generateGlobalFontSizeCSS(fontSize);
		
		const completeCss = `
			/* Global font family and size scaling for event content */
			${fontStyle ? `.bonfire-event-content { ${fontStyle} }` : ''}
			
			/* Font size scaling for all Tailwind text classes */
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

<!-- This component has no visible output, it only applies global styles -->