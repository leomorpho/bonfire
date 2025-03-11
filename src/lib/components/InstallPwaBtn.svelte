<script lang="ts">
	import '@khmyznikov/pwa-install';
	import { onMount } from 'svelte';
	import Button from './ui/button/button.svelte';
	import { Download } from 'lucide-svelte';

	let { show = true } = $props();

	let pwaInstallComponent: any = $state(null);
	const DISMISS_STORAGE_KEY = 'pwa-install-dismissed';
	const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 day in milliseconds

	// Check if user previously dismissed the prompt
	function hasDismissedRecently(): boolean {
		const storedData = localStorage.getItem(DISMISS_STORAGE_KEY);
		if (!storedData) return false;

		const { timestamp } = JSON.parse(storedData);
		return Date.now() - timestamp < DISMISS_DURATION;
	}

	// Store dismissal timestamp in localStorage
	function storeDismissal() {
		localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
	}

	// Handle the user choice result event
	function handleUserChoice(event: CustomEvent) {
		if (event.detail.message === 'dismissed') {
			storeDismissal();
		}
	}

	// Function to force show the PWA install prompt (ignores dismiss check)
	const forceShowDialog = () => {
		if (pwaInstallComponent && typeof pwaInstallComponent.showDialog === 'function') {
			pwaInstallComponent.install();
		}
	};

	onMount(() => {
		// Do not show if user dismissed recently
		if (hasDismissedRecently()) {
			return;
		}
		// Show the install prompt if conditions are met
		if (
			pwaInstallComponent &&
			!pwaInstallComponent.isUnderStandaloneMode &&
			typeof pwaInstallComponent.showDialog === 'function' &&
			show
		) {
			pwaInstallComponent.showDialog(true);
		}
		// Listen for the dismiss event
		pwaInstallComponent.addEventListener('pwa-install-available-event', (event) => {
			console.log('pwa-install:' + event.detail.message);
		});
		pwaInstallComponent.addEventListener('pwa-install-how-to-event', (event) => {
			console.log('pwa-install:' + event.detail.message);
		});
		pwaInstallComponent?.addEventListener('pwa-user-choice-result-event', handleUserChoice);
		pwaInstallComponent.addEventListener('pwa-install-success-event', (event) => {
			console.log('pwa-install:' + event.detail.message);
		});
		pwaInstallComponent.addEventListener('pwa-install-fail-event', (event) => {
			console.log('pwa-install:' + event.detail.message);
		});
		pwaInstallComponent.addEventListener('pwa-install-success-event', (event) => {
			console.log('pwa-install:' + event.detail.message);
		});
	});
</script>

<pwa-install
	bind:this={pwaInstallComponent}
	name="Bonfire App"
	manifest-url="/manifest.webmanifest"
	icon="/icon-192.png"
></pwa-install>

<!--Button to Force Show -->
<!-- <Button
	class="bg-green-500 text-white hover:bg-green-400 dark:bg-green-700 dark:hover:bg-green-600"
	onclick={forceShowDialog}><Download class="mr-1" /> Install</Button
> -->
