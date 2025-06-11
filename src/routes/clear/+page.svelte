<script lang="ts">
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { clearCache, getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		clearCache(client, true).catch((error) => {
			console.error('Failed to reset Triplit local DB:', error);
		});
	});
</script>

<div class="flex h-screen flex-col items-center justify-center p-5 text-center text-xl sm:p-10">
	<p class="mb-4">✅ Your local data has been cleared!</p>
	<p class="text-lg text-gray-600">
		The app has been reset to its default settings. You can now log in again to restore your data.
	</p>
	<a class="my-5" href="/login">
		<Button>Log In Again</Button>
	</a>
</div>
