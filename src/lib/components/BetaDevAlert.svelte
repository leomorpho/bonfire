<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	let { localstorageKey = 'dismissed-beta-dev-alert' } = $props();

	let showAlert = $state(false);

	// Check if the alert was previously dismissed
	onMount(() => {
		const dismissedDate = localStorage.getItem(localstorageKey);
		if (dismissedDate) {
			const currentDate = new Date();
			const dismissedTimestamp = new Date(dismissedDate).getTime();
			if (currentDate.getTime() < dismissedTimestamp) {
				showAlert = false;
			} else {
				showAlert = true;
			}
		} else {
			showAlert = true;
		}
	});

	function dismissAlert() {
		showAlert = false;
		const expirationDate = new Date();
		expirationDate.setDate(expirationDate.getDate() + 7); // Remember dismissal for 7 days
		localStorage.setItem(localstorageKey, expirationDate.toISOString());
	}
</script>

{#if showAlert}
	<div
		id="success-alert"
		class="mb-4 flex items-center rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-gray-700 dark:text-green-400"
		role="alert"
	>
		<svg
			class="me-3 inline h-4 w-4 shrink-0"
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
			/>
		</svg>
		<span class="sr-only">Info</span>
		<div class="text-center text-sm">
			<span class="font-medium">Hey! 👋 Thanks for trying Bonfire!</span> I'm Toby, the sole
			developer behind this indie app. While we're in Beta, if you encounter any issues or bugs,
			feel free to email me at {publicEnv.PUBLIC_FROM_EMAIL} with any information. If you're not satisfied
			for any reason, don't hesitate to ask for free logs! 🪵🪵🪵
			<br /><br />
			My wife is getting a bit tired of me working countless hours on passion projects that haven't paid
			a cent yet but cost money to host. If you find Bonfire valuable, please support us by purchasing
			logs! 🙏 Your support means the world to us and helps keep the platform running.
		</div>
		<button
			type="button"
			class="-mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-200 p-1.5 text-green-500 hover:bg-green-300 focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-green-400 dark:hover:bg-gray-700 dark:hover:dark:bg-gray-600"
			on:click={dismissAlert}
			aria-label="Close"
		>
			<span class="sr-only">Close</span>
			<X class="h-3 w-3" />
		</button>
	</div>
{/if}
