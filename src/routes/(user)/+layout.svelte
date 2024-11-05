<script lang="ts">
	import { onMount } from 'svelte';
	import { initE3Singleton } from '$lib/e3kit';
	import { Buffer } from 'buffer';


	// Load the appropriate E3Kit version based on WebAssembly support
	onMount(() => {
		window.Buffer = Buffer;

		const initEThree = async () => {
			await initE3Singleton();
		};
		initEThree().catch((error) => {
			console.error('Failed to initialize eThree:', error);
		});
	});
</script>

<slot />
