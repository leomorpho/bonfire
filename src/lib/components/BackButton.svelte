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
	function handleBackNavigation() {
		navBack(); // Fallback to history
		return false;
	}
</script>

{#if isClient}
	<Button
		id="back-page-navigation"
		type="button"
		href={url ? url : ''}
		onclick={url ? () => {} : handleBackNavigation}
		class="back-button my-1 rounded-full bg-slate-200 text-black shadow-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
	>
		{#if isLoading}
			<div class="flex items-center">
				<LoadingSpinner cls={'!h-4 !w-4'} />
			</div>
		{:else}
			<ChevronLeft class="h-4 w-4 sm:h-5 sm:w-5" />
		{/if}
	</Button>
{/if}
