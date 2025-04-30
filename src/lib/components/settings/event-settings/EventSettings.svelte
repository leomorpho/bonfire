<script lang="ts">
	import { page } from '$app/stores';
	import DeliveryPermissions from '../DeliveryPermissions.svelte';
	import NotificationTypes from '../NotificationTypes.svelte';

	let { eventId } = $props();
	const permissionClasses =
		'p-3 sm:p-5 bg-slate-200/80 p-3 dark:bg-slate-800/80 rounded-xl space-y-5 w-full';
</script>

<div class="flex w-full justify-center">
	<div class="mt-4 justify-center sm:w-[450px] md:w-[550px]">
		<div class="my-5 w-full rounded-xl bg-slate-200/80 p-3 dark:bg-slate-800/80 sm:p-8">
			<h1 class="flex w-full justify-center text-2xl font-semibold">User Event Settings</h1>
			<p class="flex w-full justify-center text-center text-base">
				Personalize your event experience by adjusting these settings. They will override your
				default preferences and apply exclusively to this event.
			</p>
		</div>

		<div class="space-y-5">
			<NotificationTypes userId={$page.data.user.id} class={permissionClasses} {eventId} />
			<DeliveryPermissions userId={$page.data.user.id} class={permissionClasses} {eventId} />
		</div>
	</div>
</div>
