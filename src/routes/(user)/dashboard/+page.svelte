<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';

	const thoughtsList = writable($page.data.thoughts);
</script>

<div class="m-5">
	<!-- History of thoughts and moods -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold mb-4">Your Thoughts History</h2>
		{#if $thoughtsList.length > 0}
			<div class="space-y-2">
				{#each $thoughtsList as thought}
					<div class="p-4 border border-gray-300 rounded-lg shadow-sm">
						<p class="text-gray-800">{thought.thought}</p>
						<p class="text-sm text-gray-500">
							Created at: {new Date(thought.createdAt).toLocaleString()}
						</p>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-gray-600">
				No thoughts recorded yet. Start by adding your first thought above.
			</p>
		{/if}
	</section>
</div>
