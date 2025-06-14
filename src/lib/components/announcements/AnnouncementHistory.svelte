<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { onMount } from 'svelte';
	import { type TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { Check } from 'lucide-svelte';
	import { X } from '@lucide/svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';
	import SearchableAttendeeList from '../SearchableAttendeeList.svelte';

	let { children, announcementId, event_id } = $props();

	let attendeesSeen: any = $state();
	let loading = $state(true);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('announcementId', announcementId);

		const unsubscribe = client.subscribe(
			client
				.query('seen_announcements')
				.Where(['announcement_id', '=', announcementId])
				.SubqueryOne(
					'attendee',
					client.query('attendees').Where(['id', '=', '$1.attendee_id']).Include('user')
				),
			(results) => {
				// Sort users based on seen status and include full user data
				attendeesSeen = results
					.filter((notification: any) => notification.seen_at != null)
					.map((notification: any) => ({
						userId: notification.attendee?.user_id,
						user: notification.attendee?.user,
						attendeeId: notification.attendee?.id
					}))
					.filter((item: any) => item.userId); // Filter out items without valid user data
				console.log('attendeesSeen', attendeesSeen, results);
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
						<SearchableAttendeeList
							attendees={attendeesSeen}
							title="Read"
							showRemoveUser={false}
							viewerIsEventAdmin={false}
							emptyMessage="No one has seen this notification"
						>
							{#snippet showIcon()}
								<Check class="ml-2 h-4 w-4 text-green-500" />
							{/snippet}
						</SearchableAttendeeList>
					{/if}
				</ScrollArea>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
