<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { onMount } from 'svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	import { dev } from '$app/environment';
	import { toast } from 'svelte-sonner';
	import PushSubscriptionPermission from '../PushSubscriptionPermission.svelte';

	let { subscriptions, permissions } = $props();
	console.log('permissions', permissions);
	console.log('subscriptions', subscriptions);
	let oneDayReminder = $state(permissions.oneDayReminder);
	let eventActivity = $state(permissions.eventActivity);
	let currentPermissionType = $state('');
	let isPushSubscriptionModalOpen = $state(false);

	// Check if the current device is already subscribed
	let isDeviceSubscribed = $state(false);

	const checkDeviceSupportsPushNotifications = () => {
		function isBrowserOnIOS() {
			var ua = window.navigator.userAgent;
			var webkit = !!ua.match(/WebKit/i);
			var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);

			if (webkit && iOS) {
				return true;
			}
			return false;
		}

		let isAppInstallable = false;

		// Check for standalone mode in Safari on iOS
		// @ts-ignore
		let isStandalone = window.navigator.standalone;

		const isAppInstalled = isStandalone || window.matchMedia('(display-mode: standalone)').matches;

		const privateBrowsing = !('serviceWorker' in navigator);

		console.log('privateBrowsing', privateBrowsing);
		console.log('isAppInstalled', isAppInstalled);

		if (!isAppInstalled) {
			isAppInstallable = !isBrowserOnIOS() && !isStandalone && !privateBrowsing;
		}

		if (!isAppInstallable) {
			toast.warning('Sorry, your current platform does not support push notifications.');
		}
		console.log('isAppInstallable', isAppInstallable);
		return isAppInstallable;
	};

	async function togglePermission(type: string) {
		currentPermissionType = type;

		if (checkDeviceSupportsPushNotifications() == false) {
			// Undo toggle
			restoreToggleState(type);
			return;
		}

		try {
			await fetch('/settings/push/toggle-permission', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});
			console.log('permission saved!');
		} catch (e) {
			toast.error('Sorry, but we failed to update this permission, please try again later');
		}
	}

	async function handleModalConfirm() {
		isPushSubscriptionModalOpen = false;
		console.log('handleModalConfirm called');

		// Proceed with permission toggle after confirmation
		await subscribeToPush();
		await togglePermission(currentPermissionType);
	}

	function handleModalCancel() {
		isDeviceSubscribed = !isDeviceSubscribed;
		isPushSubscriptionModalOpen = false;
		toast.info('Push notifications permission request canceled.');
	}

	async function isDeviceSubscribedToPush() {
		if (!subscriptions || subscriptions.length === 0) {
			return false;
		}

		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					// Check if the current subscription exists in the subscriptions prop
					console.log('Verifying subscription is present', subscriptions);
					const match = subscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
					return match;
				}
			}
		}
		return false;
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
						applicationServerKey: dev
							? publicEnv.PUBLIC_DEV_VAPID_PUBLIC_KEY
							: publicEnv.PUBLIC_VAPID_PUBLIC_KEY
					});

					// Send the subscription to the backend
					await fetch('/settings/push/subscribe', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(subscription)
					});
					console.log('subscribing to push with:', subscription);
					isDeviceSubscribed = true;
				} else {
					console.log('Device is already subscribed to push notifications.');
					isDeviceSubscribed = true;
				}
			} else {
				console.error('No existing Service Worker registration found.');
			}
		} else {
			console.log('subscribeToPush: cannot subscribe because there is no service worker');
		}
	}

	async function unsubscribeFromPush() {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					// Unsubscribe from the browser
					const success = await subscription.unsubscribe();
					if (success) {
						// Notify the server to remove the subscription
						await fetch('/settings/push/unsubscribe', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ endpoint: subscription.endpoint })
						});
						console.log('unsubscribing to push with:', subscription);

						isDeviceSubscribed = false;
						toast.success('You have unsubscribed from push notifications.');
					} else {
						toast.error('Failed to unsubscribe. Please try again later.');
					}
				}
			}
		}
	}

	async function toggleSubscription() {
		if (isDeviceSubscribed) {
			unsubscribeFromPush();
		} else {
			isPushSubscriptionModalOpen = true;
			subscribeToPush();
		}
	}

	function restoreToggleState(type: string) {
		if (type === 'eventActivity') {
			eventActivity = !eventActivity;
		} else if (type === 'oneDayReminder') {
			oneDayReminder = !oneDayReminder;
		}
	}

	onMount(async () => {
		// Check if the device is already subscribed on mount
		isDeviceSubscribed = await isDeviceSubscribedToPush();
		console.log('isDeviceSubscribed?', isDeviceSubscribed);
	});
</script>

<h3 class="flex justify-between text-xl font-semibold">
	Push Notifications <Switch
		id="push-notifications-enabled"
		bind:checked={isDeviceSubscribed}
		onclick={toggleSubscription}
	/>
</h3>
<div class="w-full space-y-5">
	<div class="flex w-full items-center justify-between space-x-2">
		<Label class="sm:text-base" for="1-day-reminder">1-day reminder</Label>
		<Switch
			id="1-day-reminder"
			bind:checked={oneDayReminder}
			onclick={(e) => togglePermission('oneDayReminder')}
			disabled={!isDeviceSubscribed}
		/>
	</div>
	<div class="flex w-full items-center justify-between space-x-2">
		<Label class="sm:text-base" for="event-activity">Event activity</Label>
		<Switch
			id="event-activity"
			bind:checked={eventActivity}
			onclick={(e) => togglePermission('eventActivity')}
			disabled={!isDeviceSubscribed}
		/>
	</div>
</div>

<PushSubscriptionPermission
	isOpen={isPushSubscriptionModalOpen}
	onConfirm={handleModalConfirm}
	onCancel={handleModalCancel}
/>
