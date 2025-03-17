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
	<div class="relative flex w-full justify-between bg-orange-500 text-white dark:bg-orange-700">
		<span></span>
		<div
			class="flex w-full max-w-screen-md items-center justify-center rounded-xl px-4 text-xs sm:text-sm"
		>
			<span class="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
				🚀 Beta is Live!
			</span>
			<div class="flex sm:ml-3">
				<Button
					variant="link"
					class="overflow-hidden text-ellipsis whitespace-nowrap text-xs  text-white hover:underline sm:text-sm"
				>
					<ArrowBigRight />
					give feedback ❤️
				</Button>
			</div>
		</div>

		<!-- Dismiss Button -->
		<button class=" mx-2 text-white opacity-70 hover:opacity-100" on:click={dismissBanner}>
			<X class="h-4 w-4 md:h-5 md:w-5" />
		</button>
	</div>
{/if}
