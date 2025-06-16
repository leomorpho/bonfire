<script lang="ts">
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { NotificationType } from '$lib/enums';
	import SearchableAttendeeList from './SearchableAttendeeList.svelte';
	import { Check, X, Search } from 'lucide-svelte';
	import AdminOnlySign from './AdminOnlySign.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from './ui/input';

	let { eventId, allAttendeesInvited } = $props();

	let attendeesSeenStatus: any[] = $state([]);
	let attendeesUnseenStatus: any[] = $state([]);
	let loading = $state(true);
	let searchTerm = $state('');

	// Filter attendees based on search
	let filteredSeenAttendees = $derived(
		attendeesSeenStatus.filter(
			(attendee) =>
				attendee.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				attendee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	let filteredUnseenAttendees = $derived(
		attendeesUnseenStatus.filter(
			(attendee) =>
				attendee.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				attendee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(() => {
		const client = getFeWorkerTriplitClient($page.data.jwt);

		// Get all invitation notifications for this event
		const unsubscribe = client.subscribe(
			client
				.query('notifications')
				.Where([
					['event_id', '=', eventId],
					['object_type', '=', NotificationType.EVENT_INVITATION]
				])
				.Select(['id', 'user_id', 'created_at']),
			async (invitationNotifications) => {
				if (!invitationNotifications.length) {
					loading = false;
					return;
				}

				// Get all attendees with user data
				const attendeesWithUsers = await client.fetch(
					client
						.query('attendees')
						.Where([['event_id', '=', eventId]])
						.Include('user')
						.Select(['id', 'user_id', 'name'])
				);

				const attendeesByUserId = new Map(attendeesWithUsers.map((att) => [att.user_id, att]));

				const seenAttendees = [];
				const unseenAttendees = [];

				// Check seen status for each invitation
				for (const notification of invitationNotifications) {
					const attendee = attendeesByUserId.get(notification.user_id);
					if (!attendee) continue;

					// Check if this invitation has been seen
					const seenRecords = await client.fetch(
						client
							.query('seen_invitations')
							.Where([
								['attendee_id', '=', attendee.id],
								['notification_id', '=', notification.id]
							])
							.Select(['id', 'seen_at'])
					);

					const attendeeData = {
						...attendee,
						invitationId: notification.id,
						invitationSentAt: notification.created_at,
						seenAt: seenRecords.length > 0 ? seenRecords[0].seen_at : null
					};

					if (seenRecords.length > 0) {
						seenAttendees.push(attendeeData);
					} else {
						unseenAttendees.push(attendeeData);
					}
				}

				attendeesSeenStatus = seenAttendees.sort(
					(a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime()
				);
				attendeesUnseenStatus = unseenAttendees.sort(
					(a, b) => new Date(b.invitationSentAt).getTime() - new Date(a.invitationSentAt).getTime()
				);

				loading = false;
			},
			(error) => {
				console.error('Error fetching invitation status:', error);
				loading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

<div class="p-4">
	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center">
			<h3 class="text-lg font-semibold">Invitation Status</h3>
			<AdminOnlySign text="Only admins can see who has seen invitations" class="ml-2" />
		</div>
		<div class="flex items-center">
			<Search class="mr-2 h-4 w-4" />
			<Input type="text" placeholder="Search attendees..." bind:value={searchTerm} class="w-64" />
		</div>
	</div>

	{#if loading}
		<div class="flex justify-center py-8">
			<div class="text-gray-500">Loading invitation status...</div>
		</div>
	{:else}
		<Tabs.Root value="seen-invitations" class="w-full">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="seen-invitations" class="flex items-center">
					<Check class="mr-2 h-4 w-4 text-green-500" />
					Seen ({attendeesSeenStatus.length})
				</Tabs.Trigger>
				<Tabs.Trigger value="unseen-invitations" class="flex items-center">
					<X class="mr-2 h-4 w-4 text-red-500" />
					Unseen ({attendeesUnseenStatus.length})
				</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="seen-invitations" class="mt-4">
				{#if filteredSeenAttendees.length === 0}
					<div class="py-8 text-center text-gray-500">
						{searchTerm
							? 'No seen invitations match your search.'
							: 'No invitations have been seen yet.'}
					</div>
				{:else}
					<div class="space-y-3">
						{#each filteredSeenAttendees as attendee}
							<div
								class="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3"
							>
								<div class="flex items-center">
									<Check class="mr-3 h-5 w-5 text-green-500" />
									<div>
										<div class="font-medium">
											{attendee.user?.username || attendee.name || 'Unknown User'}
										</div>
										{#if attendee.user?.email}
											<div class="text-sm text-gray-500">{attendee.user.email}</div>
										{/if}
									</div>
								</div>
								<div class="text-right text-sm text-gray-500">
									<div>Seen: {new Date(attendee.seenAt).toLocaleDateString()}</div>
									<div>{new Date(attendee.seenAt).toLocaleTimeString()}</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>

			<Tabs.Content value="unseen-invitations" class="mt-4">
				{#if filteredUnseenAttendees.length === 0}
					<div class="py-8 text-center text-gray-500">
						{searchTerm
							? 'No unseen invitations match your search.'
							: 'All invitations have been seen!'}
					</div>
				{:else}
					<div class="space-y-3">
						{#each filteredUnseenAttendees as attendee}
							<div
								class="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
							>
								<div class="flex items-center">
									<X class="mr-3 h-5 w-5 text-red-500" />
									<div>
										<div class="font-medium">
											{attendee.user?.username || attendee.name || 'Unknown User'}
										</div>
										{#if attendee.user?.email}
											<div class="text-sm text-gray-500">{attendee.user.email}</div>
										{/if}
									</div>
								</div>
								<div class="text-right text-sm text-gray-500">
									<div>Invited: {new Date(attendee.invitationSentAt).toLocaleDateString()}</div>
									<div>{new Date(attendee.invitationSentAt).toLocaleTimeString()}</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	{/if}
</div>
