<script lang="ts">
	import { RefreshCw } from 'lucide-svelte';
	import CenterScreenMessage from './CenterScreenMessage.svelte';
	import Button from './ui/button/button.svelte';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import * as Sentry from '@sentry/sveltekit';
	import { dev } from '$app/environment';

	// Function to reload the page
	const reloadPage = async () => {
		const client = await getFeTriplitClient($page.data.jwt);
		client?.endSession();
		window.location.reload();
	};

	// Log the event in Sentry when the component renders
	onMount(() => {
		if (!dev) {
			Sentry.captureException(new Error(`Event not found - User landed on missing event page at ${window.location}`));
			console.error(`Event not found - User landed on missing event page at ${window.location}`);
		}
	});
</script>

<CenterScreenMessage>
	<h1>Oops! We couldn’t find your event.</h1>
	<ul class="m-2 mt-3 list-disc space-y-2">
		<li>It was auto-deleted after 2 weeks 🎆</li>
		<li>It never existed 🪐</li>
		<li>We're having technical issues 🥵</li>
	</ul>
	<Button class="mt-5 text-lg" onclick={reloadPage}>
		<RefreshCw class="mr-2" /> Try Reloading
	</Button>
</CenterScreenMessage>
