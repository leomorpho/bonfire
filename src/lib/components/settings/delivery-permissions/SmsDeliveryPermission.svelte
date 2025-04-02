<script lang="ts">
	import { onMount } from 'svelte';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, type TriplitClient } from '@triplit/client';
	import { togglePermission } from '$lib/permissions';
	import { DeliveryPermissions } from '$lib/enums';

	let { userId } = $props();

	let isGranted = $state(false);
	let loadingPermisison = $state(true);
	let client: TriplitClient | undefined = $state();
	let permissionId: string | null = $state(null);

	// $inspect('pushSubscriptions', pushSubscriptions);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('delivery_permissions').Where(
				and([
					['user_id', '=', userId],
					['permission', '=', DeliveryPermissions.sms_notifications]
				])
			),
			(results) => {
				if (results.length == 1) {
					isGranted = results[0].granted;
					permissionId = results[0].id;
				}
				loadingPermisison = false;
			},
			(error) => {
				// handle error
				console.log('failed to get delivery_permissions', error);
				loadingPermisison = false;
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribe;
		};
	});

	async function subscribeToSms() {
		const permission = await togglePermission(
			client,
			userId,
			permissionId,
			DeliveryPermissions.sms_notifications,
			true
		);
	}

	async function unsubscribeFromSms() {
		await togglePermission(
			client,
			userId,
			permissionId,
			DeliveryPermissions.sms_notifications,
			false
		);
	}

	async function toggleSubscription() {
		if (isGranted) {
			unsubscribeFromSms();
		} else {
			subscribeToSms();
		}
	}
</script>

<div class="flex w-full items-center justify-between space-x-2">
	<Label.Root class="sm:text-base" for="sms-delivery-permission">SMS</Label.Root>
	<Switch.Root id="sms-delivery-permission" bind:checked={isGranted} onclick={toggleSubscription} />
</div>
