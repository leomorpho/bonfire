<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import DOMPurify from 'dompurify';
	import { BookOpen, ChevronDown, ChevronUp } from 'lucide-svelte'; // Assuming you have an icon library like Lucide

	let { eventDescription } = $props();

	let isExpanded = $state(false);
	let showExpandButton = $state(false);
	const maxHeight = 300; // Define the maximum height before collapsing

	function toggleExpand(): void {
		if (!showExpandButton) return;
		isExpanded = !isExpanded;
	}

	// // Function to check if the content overflows
	// async function checkOverflow() {
	// 	const contentElement = document.getElementById('pot-pourri');
	// 	const containerElement = document.getElementById('event-description-content-collapsed');
	// 	if (contentElement && containerElement) {
	// 		showExpandButton = contentElement.scrollHeight > containerElement.clientHeight;
	// 		console.log(
	// 			'contentElement.scrollHeight',
	// 			contentElement.scrollHeight,
	// 			containerElement.clientHeight,
	// 			contentElement.clientHeight,
	// 			contentElement.getBoundingClientRect().height,
	// 			window.getComputedStyle(contentElement).height
	// 		);
	// 	}
	// }

	// // Use ResizeObserver to handle dynamic content changes
	// $effect(() => {
	// 	const containerElement = document.getElementById('event-description-content-collapsed');
	// 	if (containerElement) {
	// 		const resizeObserver = new ResizeObserver(() => {
	// 			checkOverflow();
	// 		});
	// 		resizeObserver.observe(containerElement);
	// 		return () => resizeObserver.disconnect();
	// 	}
	// });
</script>

<div class="relative flex flex-col rounded-xl bg-slate-100/90 shadow-lg dark:bg-slate-900/90">
	<button
		class="my-3 flex w-full items-center justify-center font-semibold sm:text-xl md:text-2xl lg:mb-5"
		onclick={toggleExpand}
		aria-expanded={isExpanded}
		aria-controls="event-description-content"
	>
		<span class="flex items-center">
			<BookOpen class="mr-2" />
			Details
		</span>
	</button>
	<div class="w-full dark:bg-slate-800 dark:text-white rounded-b-xl">
		{#if eventDescription}
			<!-- {#if isExpanded}
				<div
					id="event-description-content"
					class={`prose prose-sm overflow-hidden bg-white p-4 text-black ease-in-out
             sm:prose-base focus:outline-none prose-h1:text-black prose-h2:text-black prose-p:text-black 
            prose-blockquote:text-black prose-strong:text-black
            dark:prose-h1:text-white dark:prose-h2:text-white dark:prose-p:text-white dark:prose-strong:text-white 
            sm:p-6 md:p-10 lg:p-4`}
					transition:slide={{ duration: 300 }}
				>
					{@html DOMPurify.sanitize(eventDescription)}
				</div>
			{:else}-->
			<div
				id="event-description-content-collapsed"
				class={`prose prose-sm w-full todo-max-h-[${maxHeight}px] overflow-hidden px-4
             text-black ease-in-out sm:prose-base focus:outline-none prose-h1:text-black prose-h2:text-black 
            prose-p:text-black prose-blockquote:text-black prose-strong:text-black 
            dark:text-white dark:prose-h1:text-white dark:prose-h2:text-white dark:prose-p:text-white 
            dark:prose-strong:text-white sm:px-6 md:px-10 lg:px-4 ${showExpandButton ? '' : 'rounded-b-xl'}`}
				transition:fade={{ duration: 100 }}
			>
				{#if showExpandButton}
					<div
						class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-200 via-slate-100/10 to-transparent dark:from-slate-900 dark:via-slate-900/10"
					></div>
				{/if}
				<div id="pot-pourri">{@html DOMPurify.sanitize(eventDescription)}</div>
			</div>
			<!-- {/if} -->
			<!-- {#if showExpandButton}
				<button
					class="my-2 flex items-center justify-center text-blue-500"
					onclick={toggleExpand}
					aria-expanded={isExpanded}
					aria-controls="event-description-content"
				>
					{#if isExpanded}
						<ChevronUp class="h-5 w-5" />
					{:else}
						<ChevronDown class="h-5 w-5" />
					{/if}
				</button>
			{/if} -->
		{:else}
			{'No details yet...'}
		{/if}
	</div>
</div>
