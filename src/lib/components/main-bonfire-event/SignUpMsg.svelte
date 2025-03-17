<script lang="ts">
	import { X } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';

	let showBanner = false;

	// Optional: Persist dismissal across sessions
	onMount(() => {
		if (localStorage.getItem('hideBetaBanner') === 'true') {
			showBanner = false;
		} else {
			showBanner = true;
		}
	});

	function dismissBanner() {
		showBanner = false;
		localStorage.setItem('hideBetaBanner', 'true'); // Remember dismissal
	}
</script>

{#if showBanner}
	<div class="flex w-full justify-center">
		<div
			class="relative mb-3 flex h-min w-fit flex-col items-center rounded-xl bg-orange-500/90 p-4 text-center text-white dark:bg-orange-700/90"
		>
			<!-- Dismiss Button -->
			<button
				class="absolute right-3 top-2 text-xl text-white opacity-70 hover:opacity-100"
				on:click={dismissBanner}
			>
				<X class="h-4 w-4 md:h-5 md:w-5" />
			</button>

			<div class="text-lg font-semibold">🚀 Beta Launch Special: Host 3 Events—Free!</div>
			<div class="mt-2 text-sm opacity-90">
				For a limited time, get started with 3 free events—no strings attached. Don't miss out!
			</div>

			<div class="mt-4">
				<a href="/login">
					<Button>Host an event for free</Button>
				</a>
			</div>
		</div>
	</div>
{/if}
