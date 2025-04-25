<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	// import DOMPurify from 'dompurify';

	let { eventDescription } = $props();
</script>

<div class="relative flex flex-col rounded-xl bg-slate-100/70 shadow-lg dark:bg-slate-900/70">
	<div class="w-full rounded-b-xl dark:text-white">
		<div
			id="event-description-content-collapsed"
			class={`prose prose-sm w-full overflow-hidden p-2 px-4
             text-black ease-in-out sm:prose-base focus:outline-none prose-h1:text-black prose-h2:text-black 
            prose-p:text-black prose-blockquote:text-black prose-strong:text-black 
            dark:text-white dark:prose-h1:text-white dark:prose-h2:text-white dark:prose-p:text-white 
            dark:prose-strong:text-white sm:px-6 md:px-10 lg:px-4 `}
			transition:fade={{ duration: 100 }}
		>
			{#if eventDescription}
				<div id="pot-pourri">
					<!-- {@html DOMPurify.sanitize(eventDescription)} -->
					{@html eventDescription}
				</div>
			{:else}
				<div class="flex w-full justify-center py-3">
					{'No details yet...'}
				</div>
			{/if}
		</div>
	</div>
</div>
