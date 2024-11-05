<script lang="ts">
	import { onMount } from 'svelte';
	import { initE3Singleton } from '$lib/e3kit';
	import { Buffer } from 'buffer';


	// Load the appropriate E3Kit version based on WebAssembly support
	onMount(() => {
		const initEThree = async () => {
			await initE3Singleton();
		};
		window.Buffer = Buffer;
		initEThree().catch((error) => {
			console.error('Failed to initialize eThree:', error);
		});
	});
</script>

<slot />
