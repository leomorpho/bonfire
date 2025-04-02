<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PermissionToggle from './PermissionToggle.svelte';
	import { getFeHttpTriplitClient, getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { NotificationPermissions } from '$lib/enums';

	let { userId } = $props();

	let permissionsLoading = $state(true);

	let primaryReminder: any = $state(null);
	let secondaryReminder: any = $state(null);
	let eventActivity: any = $state(null);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query('notification_permissions').Where(['user_id', '=', userId]),
			(results) => {
				// Initialize permission states based on fetched results
				results.forEach((result: any) => {
					if (result.permission === NotificationPermissions.primary_reminder) {
						primaryReminder = result;
					} else if (result.permission === NotificationPermissions.secondary_reminder) {
						secondaryReminder = result;
					} else if (result.permission === NotificationPermissions.event_activity) {
						eventActivity = result;
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

	async function togglePermission(permission: any, granted: boolean) {
		try {
			const client = getFeHttpTriplitClient($page.data.jwt);

			if (permission.id) {
				// Update existing permission
				await client.update('notification_permissions', permission.id, (o) => {
					o.granted = granted;
				});
				permission.granted = granted;
				// toast.success('Permission updated successfully.');
			} else {
				await client.insert('notification_permissions', {
					user_id: userId,
					permission: permission.permission,
					granted: granted
				});
			}
		} catch (error) {
			console.log('failed to update permissions', error);
			toast.error('An error occurred while updating the permission.');
		}
	}
</script>

<h3 class="flex justify-between text-xl font-semibold">Notification Permissions</h3>

<div class="w-full space-y-5">
	<PermissionToggle
		permissionName={NotificationPermissions.primary_reminder}
		isGranted={primaryReminder ? primaryReminder.granted : false}
		togglePermissionFunc={() =>
			togglePermission(
				primaryReminder || { permission: NotificationPermissions.primary_reminder },
				!primaryReminder?.granted
			)}
	/>
	<PermissionToggle
		permissionName={NotificationPermissions.secondary_reminder}
		isGranted={secondaryReminder ? secondaryReminder.granted : false}
		togglePermissionFunc={() =>
			togglePermission(
				secondaryReminder || { permission: NotificationPermissions.secondary_reminder },
				!secondaryReminder?.granted
			)}
	/>
	<PermissionToggle
		permissionName={NotificationPermissions.event_activity}
		isGranted={eventActivity ? eventActivity.granted : false}
		togglePermissionFunc={() =>
			togglePermission(
				eventActivity || { permission: NotificationPermissions.event_activity },
				!eventActivity?.granted
			)}
	/>
</div>
