<script lang="ts">
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		async function clearCache() {
			await client.reset();
		}

		clearCache().catch((error) => {
			console.error('Failed to reset triplit local db on logout:', error);
		});
	});
</script>

<div class="h-screen text-xl justify-center items-center flex">Your local data was all cleared!</div>
