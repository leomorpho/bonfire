<script lang="ts">
	import { Settings } from '@lucide/svelte';

	let { eventIsPublished } = $props();
</script>

<div class="flex w-full justify-center">
	<a href="update" id="edit-bonfire" class="relative">
		<Settings class="h-6 w-6" />
		{#if !eventIsPublished}
			<div
				class="absolute left-4 -top-5 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400 sm:text-sm"
			>
				<div class="w-max">Not Published</div>
			</div>
		{/if}
	</a>
</div>
