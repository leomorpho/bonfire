<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { onMount, tick } from 'svelte';
	import { PUBLIC_VAPID_PUBLIC_KEY, PUBLIC_DEV_VAPID_PUBLIC_KEY } from '$env/static/public';
	import { dev } from '$app/environment';
	import { toast } from 'svelte-sonner';

	let { subscriptions, permissions } = $props();

	let oneDayReminder = $state(permissions.oneDayReminder);
	let eventActivity = $state(permissions.eventActivity);

	// Check if the current device is already subscribed
	let isSubscribed = false;

	async function togglePermission(type: string) {
		// Subscribe to push notifications if needed
		if (!isSubscribed) {
			await subscribeToPush();
		}

		try {
			// Subscribe to push notifications if needed
			if (!isSubscribed) {
				await subscribeToPush();
			}
			await fetch('/settings/toggle-permission', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});
			console.log('permission saved!');
		} catch (e) {
			toast.error('Sorry, but we failed to update this permission, please try again later');
		}
	}

	async function subscribeToPush() {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();

			if (registration) {
				const existingSubscription = await registration.pushManager.getSubscription();

				// Check if the device is already subscribed
				if (!existingSubscription) {
					console.log('Subscribing to push notifications...');
					const subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: dev ? PUBLIC_DEV_VAPID_PUBLIC_KEY : PUBLIC_VAPID_PUBLIC_KEY
					});

					// Send the subscription to the backend
					await fetch('/settings/subscribe', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(subscription)
					});
					isSubscribed = true;
				} else {
					console.log('Device is already subscribed to push notifications.');
					isSubscribed = true;
				}
			} else {
				console.error('No existing Service Worker registration found.');
			}
		}
	}

	onMount(async () => {
		// Check if the device is already subscribed on mount
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const existingSubscription = await registration.pushManager.getSubscription();
				isSubscribed = !!existingSubscription;
			}
			console.log('isSubscribed?', isSubscribed);
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
			onclick={(e) => togglePermission('oneDayReminder')}
		/>
	</div>
	<div class="flex w-full items-center justify-between space-x-2">
		<Label class="sm:text-base" for="event-activity">Event activity</Label>
		<Switch
			id="event-activity"
			bind:checked={eventActivity}
			onchange={(e) => togglePermission('eventActivity')}
		/>
	</div>
</div>
