<script>
	import { ChevronLeft } from 'lucide-svelte';
	import { Button } from './ui/button';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import LoadingSpinner from './LoadingSpinner.svelte';

	// Ensure this component only runs on the client
	let isClient = browser;

	// Props
	let { url = null } = $props();
	let isLoading = $state(false);

	function navBack() {
		if (browser) window.history.back();
	}

	// Handle navigation
	function handleNavigation() {
		isLoading = true;
		if (url) {
			goto(url); // Redirect to provided URL
		} else {
			navBack(); // Fallback to history
		}
	}
</script>

{#if isClient}
	<Button
		onclick={handleNavigation}
		class="back-button my-1 bg-slate-200 text-black shadow-lg hover:bg-slate-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
	>
		{#if isLoading}
			<div class="flex items-center">
				<LoadingSpinner cls={'!h-4 !w-4'} />
			</div>
		{:else}
			<ChevronLeft />
		{/if}
	</Button>
{/if}
