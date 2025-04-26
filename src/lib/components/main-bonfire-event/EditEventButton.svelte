<script lang="ts">
	import { Pencil } from 'lucide-svelte';

	let { eventIsPublished, class: cls = null, url = 'update' } = $props();
</script>

<div class="flex w-full justify-center">
	<a href={url} id="edit-bonfire" class="relative">
		<div class={cls}>
			<Pencil class="h-6 w-6" />
			{#if !eventIsPublished}
				<div
					class="absolute -top-5 left-4 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400 sm:text-sm"
				>
					<div class="w-max">Not Published</div>
				</div>
			{/if}
		</div>
	</a>
</div>
