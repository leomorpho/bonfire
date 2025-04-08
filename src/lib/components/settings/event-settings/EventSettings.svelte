<script lang="ts">
	import { page } from '$app/stores';
	import DeliveryPermissions from '../DeliveryPermissions.svelte';
	import NotificationTypes from '../NotificationTypes.svelte';

	let { eventId } = $props();
	const permissionClasses =
		'm-2 p-4 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl space-y-5 w-full';
</script>

<div class="flex w-full justify-center">
	<div class="mt-4 justify-center sm:w-[450px] md:w-[550px]">
		<div class="my-5 rounded-xl bg-slate-100/80 p-3 dark:bg-slate-800/80 sm:p-8">
			<h1 class="flex w-full justify-center text-2xl font-semibold">User Event Settings</h1>
			<p class="flex w-full justify-center text-base">
				These settings override your default settings.
			</p>
		</div>

		<div class="space-y-5">
			<NotificationTypes userId={$page.data.user.id} class={permissionClasses} />
			<DeliveryPermissions userId={$page.data.user.id} class={permissionClasses} />
		</div>
	</div>
</div>
