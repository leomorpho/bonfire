<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PermissionToggle from './PermissionToggle.svelte';
	import { getFeHttpTriplitClient, getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { DeliveryPermissions } from '$lib/enums';
	import { checkDeviceSupportsPushNotifications } from '$lib/utils';
	import PushDeliveryPermission from './delivery-permissions/PushDeliveryPermission.svelte';
	import EmailDeliveryPermission from './delivery-permissions/EmailDeliveryPermission.svelte';
	import SmsDeliveryPermission from './delivery-permissions/SmsDeliveryPermission.svelte';

	let { userId } = $props();

	let permissionsLoading = $state(true);

	let smsNotifications: any = $state(null);
	let emailNotifications: any = $state(null);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('delivery_permissions').Where(['user_id', '=', userId]),
			(results) => {
				// Initialize permission states based on fetched results
				results.forEach((result: any) => {
					if (result.permission === DeliveryPermissions.sms_notifications) {
						smsNotifications = result;
					} else if (result.permission === DeliveryPermissions.email_notifications) {
						emailNotifications = result;
					}
				});
				permissionsLoading = false;
			},
			(error) => {
				console.error('Error fetching permissions:', error);
				permissionsLoading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

<div class="w-full space-y-5">
	<h3 class="flex justify-between text-xl font-semibold">Delivery Permissions</h3>
	{#if checkDeviceSupportsPushNotifications()}
		<PushDeliveryPermission {userId} />
	{/if}

	<EmailDeliveryPermission {userId} />
	<SmsDeliveryPermission {userId} />
</div>
