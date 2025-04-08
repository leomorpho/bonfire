<script lang="ts">
	import { onMount } from 'svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';

	import { dev } from '$app/environment';
	import { toast } from 'svelte-sonner';
	import { checkDeviceSupportsPushNotifications } from '$lib/utils';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, type TriplitClient } from '@triplit/client';
	import PushSubscriptionPermission from '../../PushSubscriptionPermission.svelte';
	import {
		getEffectivePermissionSettingForEvent,
		getPermissionFiltersForEventAndPermissionType,
		toggleSettingsPermission
	} from '$lib/permissions';
	import { DeliveryPermissions } from '$lib/enums';
	import { Bell } from 'lucide-svelte';

	let { userId, eventId = null, class: cls = null } = $props();

	let isGranted = $state(false);
	let pushSubscriptions = $state();
	let loadingPermisison = $state(true);
	let loadingSubscriptions = $state(true);
	let client: TriplitClient | undefined = $state();

	let isPushSubscriptionModalOpen = $state(false);

	// Check if the current device is already subscribed
	let isDeviceSubscribed = $state(false);

	let isSwitchEnabled = $derived(isDeviceSubscribed && isGranted);

	// $inspect('pushSubscriptions', pushSubscriptions);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromPushSubscription = client.subscribe(
			client.query('push_subscription_registrations').Where(['user_id', '=', userId]),
			(results) => {
				pushSubscriptions = results;
				loadingSubscriptions = false;
				checkIsDeviceSubscribed();
			},
			(error) => {
				// handle error
				console.log('failed to get push_subscription_registrations', error);
				loadingSubscriptions = false;
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		const unsubscribeFromDeliveryPerms = client.subscribe(
			client
				.query('delivery_permissions')
				.Where(
					and([
						['user_id', '=', userId],
						['permission', '=', DeliveryPermissions.push_notifications],
						getPermissionFiltersForEventAndPermissionType(eventId)
					])
				),
			(results) => {
				isGranted = getEffectivePermissionSettingForEvent(results);
				loadingPermisison = false;
			},
			(error) => {
				console.log('failed to get delivery_permissions', error);
				loadingPermisison = false;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribeFromPushSubscription();
			unsubscribeFromDeliveryPerms();
		};
	});

	async function handleModalConfirm() {
		isPushSubscriptionModalOpen = false;
		console.log('handleModalConfirm called');

		// Proceed with permission toggle after confirmation
		await subscribeToPush();
	}

	function handleModalCancel() {
		isDeviceSubscribed = !isDeviceSubscribed;
		isPushSubscriptionModalOpen = false;
		toast.info('Push notifications permission request canceled.');
	}

	async function isDeviceSubscribedToPush() {
		if (!pushSubscriptions || pushSubscriptions.length === 0) {
			return false;
		}

		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();
			if (registration) {
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) {
					// Check if the current subscription exists in the subscriptions prop
					console.log('Verifying subscription is present', pushSubscriptions);
					const match = pushSubscriptions.some(
						(sub: any) => sub.endpoint === subscription.endpoint
					);
					return match;
				}
			}
		}
		return false;
	}

	async function subscribeToPushDeliveryPerm() {
		await toggleSettingsPermission(
			client,
			userId,
			DeliveryPermissions.push_notifications,
			true,
			'delivery_permissions',
			eventId
		);
	}

	async function unsubscribeFromPushDeliveryPerm() {
		await toggleSettingsPermission(
			client,
			userId,
			DeliveryPermissions.push_notifications,
			false,
			'delivery_permissions',
			eventId
		);
	}

	async function subscribeToPush() {
		if ('serviceWorker' in navigator) {
			const registration = await navigator.serviceWorker.getRegistration();

			if (registration) {
				const existingSubscription = await registration.pushManager.getSubscription();

				// Check if the device is already subscribed
				if (!existingSubscription) {
					isPushSubscriptionModalOpen = true;

					console.log('Subscribing to push notifications...');
					const subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: dev
							? publicEnv.PUBLIC_DEV_VAPID_PUBLIC_KEY
							: publicEnv.PUBLIC_VAPID_PUBLIC_KEY
					});
					try {
						const { p256dh, auth } = subscription.keys || {};
						await client?.insert('push_subscription_registrations', {
							user_id: userId,
							endpoint: subscription.endpoint,
							p256dh: p256dh,
							auth: auth
						});

						await subscribeToPushDeliveryPerm();
					} catch (e) {
						console.log('failed to subscribe to push notifications in BE', e);
						toast.error('Sorry, we failed to save your change');
					}

					console.log('subscribing to push with:', subscription);
					isDeviceSubscribed = true;
				} else {
					console.log('Device is already subscribed to push notifications.');
					isDeviceSubscribed = true;
				}
				await subscribeToPushDeliveryPerm();
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

				// We only want to unsubscribe officially from all push notifications if it's turned off at
				// the general app level.
				if (subscription && !eventId) {
					const currSubscription = await client?.fetchOne(
						client.query('push_subscription_registrations').Where(
							and([
								['user_id', '=', userId],
								['endpoint', '=', subscription.endpoint]
							])
						)
					);

					// Unsubscribe from the browser
					const success = await subscription.unsubscribe();
					if (success) {
						if (currSubscription) {
							await client?.delete('push_subscription_registrations', currSubscription?.id);
						}

						console.log('unsubscribing to push with:', subscription);

						isDeviceSubscribed = false;
						toast.success('You have unsubscribed from push notifications.');
					} else {
						toast.error('Failed to unsubscribe. Please try again later.');
					}
				}
				await unsubscribeFromPushDeliveryPerm();
			}
		}
	}

	async function toggleSubscription() {
		if (isSwitchEnabled) {
			unsubscribeFromPush();
		} else {
			subscribeToPush();
		}
	}

	const checkIsDeviceSubscribed = async () => {
		isDeviceSubscribed = await isDeviceSubscribedToPush();
		console.log('isDeviceSubscribed?', isDeviceSubscribed);
	};
</script>

<div class={`flex w-full items-center justify-between space-x-2 ${cls}`}>
	<Label.Root class="flex items-center sm:text-base" for="push-delivery-permission">
		<Bell class="mr-2 h-4 w-4" />
		Push notifications</Label.Root
	>
	<Switch.Root
		id="push-delivery-permission"
		bind:checked={isSwitchEnabled}
		onclick={toggleSubscription}
		disabled={!checkDeviceSupportsPushNotifications()}
	/>
</div>

<PushSubscriptionPermission
	isOpen={isPushSubscriptionModalOpen}
	onConfirm={handleModalConfirm}
	onCancel={handleModalCancel}
/>
