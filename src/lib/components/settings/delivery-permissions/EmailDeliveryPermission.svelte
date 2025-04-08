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
	import { CircleAlert, Mail } from 'lucide-svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';

	let { userId, eventId = null, class: cls = null } = $props();

	let isGranted = $state(false);
	let loadingPermisison = $state(true);
	let client: TriplitClient | undefined = $state();

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('delivery_permissions')
				.Where(
					and([
						['user_id', '=', userId],
						['permission', '=', DeliveryPermissions.email_notifications],
						getPermissionFiltersForEventAndPermissionType(eventId)
					])
				),
			(results) => {
				console.log('results email', results);
				isGranted = getEffectivePermissionSettingForEvent(results);
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

	async function subscribeToEmail() {
		await toggleSettingsPermission(
			client,
			userId,
			DeliveryPermissions.email_notifications,
			true,
			'delivery_permissions',
			eventId
		);
	}

	async function unsubscribeFromEmail() {
		await toggleSettingsPermission(
			client,
			userId,
			DeliveryPermissions.email_notifications,
			false,
			'delivery_permissions',
			eventId
		);
	}

	async function toggleSubscription() {
		if (isGranted) {
			unsubscribeFromEmail();
		} else {
			subscribeToEmail();
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
				We hate spam too. Like for SMS, only important notifications, like event reminders and admin
				announcements, are sent via email when enabled. We recommend keeping it on for the best
				experience. You can disable it for specific events if needed.
			</HoverCard.Content>
		</HoverCard.Root>
	</div>
{/snippet}

<div class={`flex w-full items-center justify-between space-x-2 ${cls}`}>
	<Label.Root class="flex items-center sm:text-base" for="email-delivery-permission">
		<Mail class="mr-2 h-4 w-4" />
		Email
		{@render warning()}
	</Label.Root>
	<Switch.Root
		id="email-delivery-permission"
		bind:checked={isGranted}
		onclick={toggleSubscription}
	/>
</div>
