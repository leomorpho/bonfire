<script lang="ts">
	import { ArrowBigRight, X } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';

	let showBanner = false;

	// Check if the banner was previously dismissed
	onMount(() => {
		if (localStorage.getItem('hideTopBanner') === 'true') {
			showBanner = false;
		} else {
			showBanner = true;
		}
	});

	function dismissBanner() {
		showBanner = false;
		localStorage.setItem('hideTopBanner', 'true'); // Remember dismissal
	}
</script>

{#if showBanner}
	<div
		class="relative flex w-full justify-between bg-orange-200 dark:bg-orange-900 dark:text-white"
	>
		<span></span>
		<div
			class="flex w-full max-w-screen-md items-center justify-center rounded-xl px-4 py-1 text-xs"
		>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap">
				📣 Beta is Live! Click <a href="/feedback" class="underline">here</a> to give me feedback ❤️
			</span>
		</div>

		<!-- Dismiss Button -->
		<button class=" mx-2 opacity-70 hover:opacity-100" on:click={dismissBanner}>
			<X class="h-4 w-4 md:h-5 md:w-5" />
		</button>
	</div>
{/if}
