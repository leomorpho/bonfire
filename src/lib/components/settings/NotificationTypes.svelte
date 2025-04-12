<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PermissionToggle from './PermissionToggle.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { and, type TriplitClient } from '@triplit/client';
	import { NotificationPermissions } from '$lib/enums';
	import {
		getEffectivePermissionSettingForEvent,
		getPermissionFiltersForEventAndPermissionType,
		hasAnyEffectivePermissionGranted,
		toggleSettingsPermission
	} from '$lib/permissions';
	import type { PermissionsArray } from '$lib/types';

	let { userId, eventId = null, class: cls = null } = $props();

	let permissionsLoading = $state(true);

	let isPrimaryReminderGranted: any = $state(null);
	let isSecondaryReminderGranted: any = $state(null);
	let isEventActivityGranted: any = $state(null);

	let hasNoDeliveryPermissionSet = $state(false);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromNotificationPermissions = client.subscribe(
			client
				.query('notification_permissions')
				.Where(
					and([['user_id', '=', userId], getPermissionFiltersForEventAndPermissionType(eventId)])
				),
			(results) => {
				// Separate results into respective categories
				const primaryReminders: PermissionsArray = [];
				const secondaryReminders: PermissionsArray = [];
				const eventActivities: PermissionsArray = [];

				results.forEach((result: any) => {
					switch (result.permission) {
						case NotificationPermissions.primary_reminder:
							primaryReminders.push(result);
							break;
						case NotificationPermissions.secondary_reminder:
							secondaryReminders.push(result);
							break;
						case NotificationPermissions.event_activity:
							eventActivities.push(result);
							break;
						default:
							console.warn(`Unknown permission type: ${result.permission}`);
					}
				});
				// console.log('secondaryReminders', secondaryReminders);
				// console.log('secondaryReminders', secondaryReminders);
				// console.log('eventActivities', eventActivities);

				// Set the effective permission settings for each category
				isPrimaryReminderGranted = getEffectivePermissionSettingForEvent(primaryReminders);
				isSecondaryReminderGranted = getEffectivePermissionSettingForEvent(secondaryReminders);
				isEventActivityGranted = getEffectivePermissionSettingForEvent(eventActivities);

				permissionsLoading = false;
			},
			(error) => {
				console.error('Error fetching permissions:', error);
				permissionsLoading = false;
			}
		);

		const unsubscribeFromDeliveryPermissions = client.subscribe(
			client
				.query('delivery_permissions')
				.Where(
					and([['user_id', '=', userId], getPermissionFiltersForEventAndPermissionType(eventId)])
				),
			(results) => {
				hasNoDeliveryPermissionSet = !hasAnyEffectivePermissionGranted(results);
			},
			(error) => {
				console.error('Error fetching delivery permissions in NotificationTypes:', error);
				permissionsLoading = false;
			}
		);

		return () => {
			unsubscribeFromNotificationPermissions();
			unsubscribeFromDeliveryPermissions();
		};
	});

	async function togglePermission(permissionType: string, granted: boolean) {
		try {
			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
			await toggleSettingsPermission(
				client,
				userId,
				permissionType,
				granted,
				'notification_permissions',
				eventId
			);
		} catch (error) {
			console.log('failed to update permissions', error);
			toast.error('An error occurred while updating the permission.');
		}
	}
</script>

<div class={`${cls}`}>
	<h3 class="flex justify-between text-xl font-semibold">Notification Permissions</h3>

	{#if hasNoDeliveryPermissionSet}
		<div
			class="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-800 dark:text-yellow-300"
			role="alert"
		>
			<span class="font-medium">You won't receive any notifications!</span> You first need to grant at
			least 1 delivery permission.
		</div>
	{/if}
	<div class="w-full space-y-5">
		<PermissionToggle
			permissionName={NotificationPermissions.primary_reminder}
			isGranted={isPrimaryReminderGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.primary_reminder, !isPrimaryReminderGranted)}
		/>
		<PermissionToggle
			permissionName={NotificationPermissions.secondary_reminder}
			isGranted={isSecondaryReminderGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.secondary_reminder, !isSecondaryReminderGranted)}
		/>
		<PermissionToggle
			permissionName={NotificationPermissions.event_activity}
			isGranted={isEventActivityGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.event_activity, !isEventActivityGranted)}
		/>
	</div>
</div>
