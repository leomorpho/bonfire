<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { waitForEThree } from '$lib/e3kit';

	const thoughtsList = writable($page.data.thoughts);

	onMount(() => {
		window.userId = $page.data.userId;
		const initEThree = async () => {
			const initializedEThree = await waitForEThree();
			initializedEThree.cleanup();
			console.log('eThree cleanup up');
		};
		initEThree().catch((error) => {
			console.error('Failed to initialize eThree:', error);
		});
	});
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="m-4 mb-5 text-xl sm:text-2xl">You've been logged out!</h1>
</div>
