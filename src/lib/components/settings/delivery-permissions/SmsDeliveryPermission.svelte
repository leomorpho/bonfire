<script lang="ts">
	import { onMount } from 'svelte';
	import * as Label from '$lib/components/ui/label/index.js';
	import * as Switch from '$lib/components/ui/switch/index.js';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, type TriplitClient } from '@triplit/client';
	import {
		getEffectivePermissionSettingForEvent,
		getPermissionFiltersForEventAndPermissionType,
		toggleSettingsPermission
	} from '$lib/permissions';
	import { DeliveryPermissions } from '$lib/enums';
	import { goto } from '$app/navigation';
	import { MessageCircle } from 'lucide-svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { CircleAlert } from '@lucide/svelte';

	let { userId, eventId = null, class: cls = null } = $props();

	let isGranted = $state(false);
	let loadingPermisison = $state(true);
	let client: TriplitClient | undefined = $state();
	let phoneNumber: string | null = $state(null);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromDeliveryPerms = client.subscribe(
			client
				.query('delivery_permissions')
				.Where(
					and([
						['user_id', '=', userId],
						['permission', '=', DeliveryPermissions.sms_notifications],
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

		const unsubscribeFromUserPersonalData = client.subscribe(
			client.query('user_personal_data').Where(['user_id', '=', userId]).Select(['phone_number']),
			(results) => {
				if (results.length == 1) {
					const pi = results[0];
					phoneNumber = pi.phone_number;
				}
			},
			(error) => {
				console.log('failed to get user_personal_data', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribeFromDeliveryPerms();
			unsubscribeFromUserPersonalData();
		};
	});

	async function subscribeToSms() {
		if (!phoneNumber) {
			goto('/settings/phone');
			return;
		}

		await toggleSettingsPermission(
			client?.http,
			userId,
			DeliveryPermissions.sms_notifications,
			true,
			'delivery_permissions',
			eventId
		);
	}

	async function unsubscribeFromSms() {
		await toggleSettingsPermission(
			client?.http,
			userId,
			DeliveryPermissions.sms_notifications,
			false,
			'delivery_permissions',
			eventId
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

{#snippet warning()}
	<div class="ml-2">
		<HoverCard.Root>
			<HoverCard.Trigger
				onclick={(e) => {
					e.preventDefault();
				}}
			>
				<div
					class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-400"
				>
					<CircleAlert class="h-4 w-4" />
				</div>
			</HoverCard.Trigger>
			<HoverCard.Content class="text-center text-sm">
				We hate spam too. Only important notifications, like event reminders and admin
				announcements, are sent via SMS when enabled. We recommend keeping it on for the best
				experience. You can disable it for specific events if needed.
			</HoverCard.Content>
		</HoverCard.Root>
	</div>
{/snippet}

<div class={`flex w-full items-center justify-between space-x-2 ${cls}`}>
	<Label.Root class="flex items-center sm:text-base" for="sms-delivery-permission">
		<MessageCircle class="mr-2 h-4 w-4" />
		SMS
		{@render warning()}
	</Label.Root>
	<Switch.Root id="sms-delivery-permission" bind:checked={isGranted} onclick={toggleSubscription} />
</div>
