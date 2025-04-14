<script lang="ts">
	import { checkDeviceSupportsPushNotifications } from '$lib/utils';
	import PushDeliveryPermission from './delivery-permissions/PushDeliveryPermission.svelte';
	import EmailDeliveryPermission from './delivery-permissions/EmailDeliveryPermission.svelte';
	import SmsDeliveryPermission from './delivery-permissions/SmsDeliveryPermission.svelte';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, type TriplitClient } from '@triplit/client';
	import {
		getPermissionFiltersForEventAndPermissionType,
		hasAnyEffectivePermissionGranted
	} from '$lib/permissions';

	let { userId, eventId = null, class: cls = null } = $props();

	let hasNoNotificationPermissionSet = $state(false);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromNotificationPermissions = client.subscribe(
			client
				.query('notification_permissions')
				.Where(
					and([['user_id', '=', userId], getPermissionFiltersForEventAndPermissionType(eventId)])
				),
			(results) => {
				// Check if any permission has granted = true
				hasNoNotificationPermissionSet = !hasAnyEffectivePermissionGranted(results);
				console.log('hasNoNotificationPermissionSet', hasNoNotificationPermissionSet, results);
			},
			(error) => {
				console.error('Error fetching notifications permissions in DeliveryPermissions:', error);
			}
		);

		return () => {
			unsubscribeFromNotificationPermissions();
		};
	});
</script>

<div class={`w-full space-y-5 ${cls}`}>
	<h3 class="flex justify-between text-xl font-semibold">Delivery Permissions</h3>
	{#if hasNoNotificationPermissionSet}
		<div
			class="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-800 dark:text-yellow-300"
			role="alert"
		>
			<span class="font-medium">You won't receive any notifications!</span> Turn on at least 1 notification
			permission above.
		</div>
	{/if}

	{#if checkDeviceSupportsPushNotifications()}
		<PushDeliveryPermission {userId} {eventId} />
	{/if}

	<EmailDeliveryPermission {userId} {eventId} />
	<SmsDeliveryPermission {userId} {eventId} />
</div>
