<script lang="ts">
	import { Cog } from 'lucide-svelte';
	import { Button } from '../ui/button';

	let { eventIsPublished } = $props();
</script>

<div class="flex w-full justify-center">
	<a href="update" id="edit-bonfire" class="relative">
		<Button variant="outline" class="m-2 rounded-full">
			<Cog class="h-5 w-5" />
		</Button>
		{#if !eventIsPublished}
			<div
				class="absolute -right-20 -top-1 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400 sm:-right-[100px] sm:-top-2 sm:text-sm"
			>
				<div class="w-max">Not Published</div>
			</div>
		{/if}
	</a>
</div>
