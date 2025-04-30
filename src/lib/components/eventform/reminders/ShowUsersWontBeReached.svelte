<script lang="ts">
	import { page } from '$app/stores';
	import ProfileAvatar from '$lib/components/profile/profile-avatar/ProfileAvatar.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let { eventId } = $props();

	let userIdsWontBeReached = $state([]);

	let client: TriplitClient | undefined = $state();

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('user')
				.Where(['attendances.event_id', '=', eventId])
				.Select(['id'])
				.Include('delivery_permissions')
				.Include('notification_permissions'),
			(results) => {
				const userIdsWontBeReachedSet = new Set([]);
				for (const user of results) {
					if (
						!user.delivery_permissions ||
						!user.notification_permissions ||
						user.delivery_permissions?.length == 0 ||
						user.notification_permissions?.length == 0
					) {
						userIdsWontBeReachedSet.add(user.id);
					}
				}
				userIdsWontBeReached = Array.from(userIdsWontBeReachedSet);
				console.log('userIdsWontBeReached', userIdsWontBeReached);
			},
			(error) => {
				// handle error
				console.log('failed to get delivery_permissions', error);
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
</script>

{#if userIdsWontBeReached.length > 0}
	<div class="mb-3 mt-5">
		<h2
			class="my-3 flex w-full justify-center rounded-xl bg-yellow-200/80 p-2 text-sm font-semibold dark:bg-yellow-800/80"
		>
			{userIdsWontBeReached.length}
			{userIdsWontBeReached.length > 1 ? 'attendees' : 'attendee'}
			can't be reached by the app for reminders or event communications due to disabled permissions.
			Please contact them through another platform to ask them to enable these settings.
		</h2>
		<div class="mx-5 flex flex-wrap -space-x-4 text-black">
			{#each userIdsWontBeReached as userId (userId)}
				<div animate:flip out:fade={{ duration: 300 }}>
					<ProfileAvatar {userId} viewerIsEventAdmin={true} />
				</div>
			{/each}
		</div>
	</div>
{/if}
