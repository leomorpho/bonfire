<script>
	import { onMount } from 'svelte';
    import { Buffer } from 'buffer';

	// Function to check WebAssembly support
	function isWebAssemblySupported() {
		return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
	}

	// This tokenCallback function should fetch the JWT from your backend
	const tokenCallback = async () => {
		// Fetch the JWT from your backend, e.g. using fetch
		const response = await fetch('/api/e3kit-jwt');
		if (!response.ok) throw new Error('Failed to fetch token');
		const data = await response.json();
		console.log(data.virgilToken);
		return data.virgilToken;
	};

	// Load the appropriate E3Kit version based on WebAssembly support
	onMount(() => {
		// Define global polyfill for `global` if not defined
		if (typeof global === 'undefined') {
			window.global = window;
		}
		

		// @ts-ignore
		window.Buffer = Buffer;

		const script = document.createElement('script');

		// Error handling for script loading
		script.onerror = () => {
			console.error('Failed to load E3Kit script.');
		};

		script.onload = async () => {
			// Make this callback async
			const EThree = window.E3kit.EThree;

			if (EThree) {
				console.log('EThree loaded:', EThree);
				// Now you can initialize E3Kit here
				try {
					console.log(`window.userId: ${window.userId}`);
					await EThree.initialize(tokenCallback, window.userId);
				} catch (error) {
					console.error('Failed to initialize E3Kit:', error);
				}
			} else {
				console.error('EThree is not defined.');
			}
		};

		if (isWebAssemblySupported()) {
			console.log('WebAssembly is supported');
			script.src = 'https://unpkg.com/@virgilsecurity/e3kit-browser/dist/browser.umd.js';
		} else {
			console.log('WebAssembly is NOT supported, loading asm.js fallback');
			script.src = 'https://unpkg.com/@virgilsecurity/e3kit-browser/dist/browser.asmjs.umd.js';
		}

		document.body.appendChild(script);
	});
</script>

<slot />
