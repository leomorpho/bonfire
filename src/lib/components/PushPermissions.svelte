<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { onMount } from 'svelte';
	import { PUBLIC_VAPID_PUBLIC_KEY, PUBLIC_DEV_VAPID_PUBLIC_KEY } from '$env/static/public';
	import { dev } from '$app/environment';

	let { subscriptions, permissions } = $props();

	let oneDayReminder = permissions.oneDayReminder;
	let eventActivity = permissions.eventActivity;

	async function togglePermission(type: string, value: boolean) {
		await fetch('/settings/toggle-permission', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type, value })
		});
	}

	onMount(async () => {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.register('/service-worker.js');

			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: dev ? PUBLIC_DEV_VAPID_PUBLIC_KEY : PUBLIC_VAPID_PUBLIC_KEY
			});

			// Send subscription to the backend
			await fetch('/settings/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscription)
			});
		}
	});
</script>

<h3 class="text-xl font-semibold">Push Notifications</h3>
<div class="w-full space-y-5">
	<div class="flex w-full items-center justify-between space-x-2">
		<Label class="sm:text-base" for="1-day-reminder">1-day reminder</Label>
		<Switch
			id="1-day-reminder"
			bind:checked={oneDayReminder}
			onchange={(e) => togglePermission('oneDayReminder', e.detail)}
		/>
	</div>
	<div class="flex w-full items-center justify-between space-x-2">
		<Label class="sm:text-base" for="event-activity">Event activity</Label>
		<Switch
			id="event-activity"
			bind:checked={eventActivity}
			onchange={(e) => togglePermission('eventActivity', e.detail)}
		/>
	</div>
</div>
