<script>
	import { ChevronLeft } from 'lucide-svelte';
	import { Button } from './ui/button';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	// Ensure this component only runs on the client
	let isClient = browser;

	// Props
	let { url = null } = $props();

	// Handle navigation
	function handleNavigation() {
		if (url) {
			goto(url); // Redirect to provided URL
		} else {
			history.back(); // Fallback to history
		}
	}
</script>

{#if isClient}
	<Button
		onclick={handleNavigation}
		class="back-button my-1 bg-slate-200 hover:bg-slate-100 shadow-lg text-black dark:bg-slate-700 dark:text-white dark:hover:bg-slate-500"
	>
		<ChevronLeft />
	</Button>
{/if}
