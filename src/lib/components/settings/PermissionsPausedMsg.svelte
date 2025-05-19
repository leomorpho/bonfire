<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { type TriplitClient } from '@triplit/client';
	import { hasAnyEffectivePermissionGranted } from '$lib/permissions';

	let { userId } = $props();

	let hasNoDeliveryPermissionSet = $state(false);
	let deliveryPermsReturnedByServer = $state(false);
	let hasNoNotificationPermissionSet = $state(false);
	let notifPermsReturnedByServer = $state(false);
	let client: TriplitClient | undefined = $state();

	// TODO: there is a bug where the db is getting stale/incorrect data which leads to showing this in the wrong conditions
	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromDeliveryPermissions = client.subscribe(
			client.query('delivery_permissions').Where(['user_id', '=', userId]),
			(results) => {
				// Check if any permission has granted = true
				hasNoDeliveryPermissionSet = !hasAnyEffectivePermissionGranted(results);
				console.log(
					'hasNoDeliveryPermissionSet results',
					hasNoDeliveryPermissionSet,
					results,
					userId
				);
				deliveryPermsReturnedByServer = true;
			},
			(error) => {
				console.error('Error fetching delivery permissions', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log('server has sent back results for the subscription');
					deliveryPermsReturnedByServer = true;
				}
			}
		);

		const unsubscribeFromNotificationPermissions = client.subscribe(
			client.query('notification_permissions').Where(['user_id', '=', userId]),
			(results) => {
				// Check if any permission has granted = true
				hasNoNotificationPermissionSet = !hasAnyEffectivePermissionGranted(results);
				console.log(
					'hasNoNotificationPermissionSet results',
					hasNoNotificationPermissionSet,
					results,
					userId
				);
				notifPermsReturnedByServer = true;
			},
			(error) => {
				console.error('Error fetching notifications permissions', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log('server has sent back results for the subscription');
					notifPermsReturnedByServer = true;
				}
			}
		);

		return () => {
			unsubscribeFromDeliveryPermissions();
			unsubscribeFromNotificationPermissions();
		};
	});
</script>

{#if (hasNoDeliveryPermissionSet && deliveryPermsReturnedByServer) || (hasNoNotificationPermissionSet && notifPermsReturnedByServer)}
	<div
		class="mb-4 flex items-center justify-center rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-700 dark:text-yellow-300"
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
		<div class="space-y-2 text-center md:space-y-4">
			<span class="text-base font-medium">🔕 Notifications Paused</span>
			<p>You're currently not receiving event updates, reminders, or communications.</p>
			<a href="/settings">
				<button
					class="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
				>
					Click here to turn them back on
				</button>
			</a>
		</div>
	</div>
{/if}
