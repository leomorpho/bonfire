<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { onMount } from 'svelte';
	import { PUBLIC_VAPID_PUBLIC_KEY, PUBLIC_DEV_VAPID_PUBLIC_KEY } from '$env/static/public';
	import { dev } from '$app/environment';

	onMount(async () => {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.register('/service-worker.js');

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: dev ? PUBLIC_DEV_VAPID_PUBLIC_KEY : PUBLIC_VAPID_PUBLIC_KEY
			});

			// Send subscription to your backend
			await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscription)
			});
		}
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-2 w-full px-5 sm:w-[450px]">
		<h2 class="my-6 text-2xl font-semibold">Settings</h2>

		<div class="mt-10 space-y-5">
			<h3 class="text-xl font-semibold">Push Notifications</h3>
			<div class="w-full space-y-5">
				<div class="flex w-full items-center justify-between space-x-2">
					<Label class="sm:text-base" for="1-day-reminder">1-day reminder</Label>
					<Switch id="1-day-reminder" />
				</div>
				<div class="flex w-full items-center justify-between space-x-2">
					<Label class="sm:text-base" for="event-activity">Event activity</Label>
					<Switch id="event-activity" />
				</div>
			</div>
		</div>

		<div class="mt-10 space-y-5">
			<h3 class="text-xl font-semibold">Danger</h3>

			<div class="flex flex-col justify-center space-y-3">
				<Button class="bg-red-500 hover:bg-red-400">Delete Account</Button>
			</div>
		</div>
	</section>
</div>
