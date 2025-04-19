<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { onMount } from 'svelte';
	import { and, or, type TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { NotificationType } from '$lib/enums';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { Check } from 'lucide-svelte';
	import { X } from '@lucide/svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';

	let { children, announcementId, event_id } = $props();

	let notifications: any = $state();
	let attendeesSeen: any = $state();
	let attendeesUnseen: any = $state();
	let loading = $state(true);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('announcementId', announcementId);
		const unsubscribe = client.subscribe(
			client.query('notifications').Where(
				and([
					or([
						['object_ids', 'like', `%${announcementId}%`],
						['object_ids_set', 'has', announcementId]
					]),
					['event_id', '=', event_id],
					['object_type', '=', NotificationType.ANNOUNCEMENT]
				])
			),
			(results) => {
				notifications = results;

				// Sort users based on seen status
				attendeesSeen = results
					.filter((notification: any) => notification.seen_at != null)
					.map((notification: any) => notification.user_id);
				attendeesUnseen = results
					.filter((notification: any) => notification.seen_at == null)
					.map((notification: any) => notification.user_id);

				loading = false;
			},
			(error) => {
				console.error('Error fetching data:', error);
				loading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

{#snippet attendees(title: string, attendees: any, seen: boolean = false)}
	<div class="mb-3 mt-5">
		<h2 class="my-3 flex w-full items-center justify-center font-semibold">
			{title}
			{#if seen}
				<Check class="ml-2 h-4 w-4 text-green-500" />
			{:else}
				<X class="ml-2 h-4 w-4 text-red-500" />
			{/if}
		</h2>
		{#if attendees.length > 0}
			<div class="mx-5 flex flex-wrap -space-x-4 text-black">
				{#each attendees as attendee (attendee)}
					<div animate:flip out:fade={{ duration: 300 }}>
						<ProfileAvatar userId={attendee} />
					</div>
				{/each}
			</div>
		{:else if seen}
			<div class="flex w-full justify-center">No one has read it</div>
		{:else}
			<div class="flex w-full justify-center">No one missed it</div>
		{/if}
	</div>
{/snippet}

<Dialog.Root>
	<Dialog.Trigger>{@render children()}</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title class="flex w-full items-center justify-center">
				Who's seen it?
				<AdminOnlySign text={'Only admins can see who has seen an announcement'} class={'mx-2'} />
			</Dialog.Title>
			<Dialog.Description>
				<ScrollArea>
					{#if loading}
						Loading
					{:else}
						{@render attendees('Read', attendeesSeen, true)}
						{@render attendees('Unread', attendeesUnseen)}
					{/if}
				</ScrollArea>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
