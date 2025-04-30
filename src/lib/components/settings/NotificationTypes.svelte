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
	import { Activity, MessageCircle } from 'lucide-svelte';
	import { BellRing, Image, MicVocal } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let { userId, eventId = null, class: cls = null } = $props();

	let permissionsLoading = $state(true);

	let isEventRemindersGranted: any = $state(null);
	let isEventActivityGranted: any = $state(null);
	let isEventFileUploadedGranted: any = $state(null);
	let isEventMessagesGranted: any = $state(null);

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
				const eventReminders: PermissionsArray = [];
				const eventActivities: PermissionsArray = [];
				const eventFilesUploaded: PermissionsArray = [];
				const eventMessages: PermissionsArray = [];

				results.forEach((result: any) => {
					switch (result.permission) {
						case NotificationPermissions.event_reminders:
							eventReminders.push(result);
							break;
						case NotificationPermissions.event_activity:
							eventActivities.push(result);
							break;
						case NotificationPermissions.event_files_uploaded:
							eventFilesUploaded.push(result);
							break;
						case NotificationPermissions.event_messages:
							eventMessages.push(result);
							break;
						default:
							console.warn(`Unknown permission type: ${result.permission}`);
					}
				});

				// Set the effective permission settings for each category
				isEventRemindersGranted = getEffectivePermissionSettingForEvent(eventReminders);
				isEventActivityGranted = getEffectivePermissionSettingForEvent(eventActivities);
				isEventFileUploadedGranted = getEffectivePermissionSettingForEvent(eventFilesUploaded);
				isEventMessagesGranted = getEffectivePermissionSettingForEvent(eventMessages);

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
				client.http,
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
			class="mb-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-700 dark:text-yellow-300"
			role="alert"
			transition:slide={{ duration: 300 }}
		>
			<span class="font-medium">You won't receive any notifications!</span> You first need to grant at
			least 1 delivery permission.
		</div>
	{/if}
	<div class="w-full space-y-5">
		<PermissionToggle
			permissionName={NotificationPermissions.event_reminders}
			isGranted={isEventRemindersGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.event_reminders, !isEventRemindersGranted)}
		>
			<BellRing class="mr-2 h-4 w-4" />
		</PermissionToggle>

		<PermissionToggle
			permissionName={NotificationPermissions.event_activity}
			isGranted={isEventActivityGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.event_activity, !isEventActivityGranted)}
		>
			<Activity class="mr-2 h-4 w-4" />
		</PermissionToggle>

		<PermissionToggle
			permissionName={NotificationPermissions.event_files_uploaded}
			isGranted={isEventActivityGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.event_files_uploaded, !isEventActivityGranted)}
		>
			<Image class="mr-2 h-4 w-4" />
		</PermissionToggle>

		<PermissionToggle
			permissionName={NotificationPermissions.event_messages}
			isGranted={isEventActivityGranted}
			togglePermissionFunc={() =>
				togglePermission(NotificationPermissions.event_messages, !isEventActivityGranted)}
		>
			<MessageCircle class="mr-2 h-4 w-4" />
		</PermissionToggle>
	</div>
</div>
