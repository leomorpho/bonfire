<script lang="ts">
	import { checkDeviceSupportsPushNotifications } from '$lib/utils';
	import PushDeliveryPermission from './delivery-permissions/PushDeliveryPermission.svelte';
	import EmailDeliveryPermission from './delivery-permissions/EmailDeliveryPermission.svelte';
	import SmsDeliveryPermission from './delivery-permissions/SmsDeliveryPermission.svelte';

	let { userId, eventId = null, class: cls = null } = $props();
</script>

<div class={`w-full space-y-5 ${cls}`}>
	<h3 class="flex justify-between text-xl font-semibold">Delivery Permissions</h3>
	{#if checkDeviceSupportsPushNotifications()}
		<PushDeliveryPermission {userId} {eventId}/>
	{/if}

	<EmailDeliveryPermission {userId} {eventId}/>
	<SmsDeliveryPermission {userId} {eventId}/>
</div>
