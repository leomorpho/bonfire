<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { onMount } from 'svelte';
	import { type TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { Check, Search } from 'lucide-svelte';
	import { X } from '@lucide/svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';
	import SearchableAttendeeList from '../SearchableAttendeeList.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Input } from '../ui/input';

	let { children, announcementId, event_id } = $props();

	let attendeesSeen: any[] = $state([]);
	let attendeesUnseen: any[] = $state([]);
	let loading = $state(true);
	let searchTerm = $state('');

	// Filter attendees based on search
	let filteredSeenAttendees = $derived(
		attendeesSeen.filter(attendee =>
			attendee.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attendee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	let filteredUnseenAttendees = $derived(
		attendeesUnseen.filter(attendee =>
			attendee.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attendee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			attendee.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	);

	onMount(async () => {
		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		console.log('announcementId', announcementId);

		try {
			// Get all attendees for this event
			const allAttendees = await client.fetch(
				client
					.query('attendees')
					.Where([['event_id', '=', event_id]])
					.Include('user')
					.Select(['id', 'user_id', 'name'])
			);

			// Get all seen announcements for this announcement
			const seenAnnouncements = await client.fetch(
				client
					.query('seen_announcements')
					.Where(['announcement_id', '=', announcementId])
					.Select(['attendee_id', 'seen_at'])
			);

			const seenAttendeeIds = new Set(seenAnnouncements.map(sa => sa.attendee_id));
			const seenAttendeesMap = new Map(seenAnnouncements.map(sa => [sa.attendee_id, sa.seen_at]));

			// Split attendees into seen and unseen
			const seen = [];
			const unseen = [];

			for (const attendee of allAttendees) {
				const attendeeData = {
					userId: attendee.user_id,
					user: attendee.user,
					attendeeId: attendee.id,
					name: attendee.name,
					seenAt: seenAttendeesMap.get(attendee.id)
				};

				if (seenAttendeeIds.has(attendee.id)) {
					seen.push(attendeeData);
				} else {
					unseen.push(attendeeData);
				}
			}

			// Sort seen by most recent first, unseen by name
			attendeesSeen = seen.sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime());
			attendeesUnseen = unseen.sort((a, b) => {
				const nameA = a.user?.username || a.name || '';
				const nameB = b.user?.username || b.name || '';
				return nameA.localeCompare(nameB);
			});

			loading = false;
		} catch (error) {
			console.error('Error fetching announcement status:', error);
			loading = false;
		}
	});
</script>

<Dialog.Root>
	<Dialog.Trigger>{@render children()}</Dialog.Trigger>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="flex w-full items-center justify-center">
				Announcement Status
				<AdminOnlySign text={'Only admins can see who has seen an announcement'} class={'mx-2'} />
			</Dialog.Title>
			<Dialog.Description>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center">
						<Search class="h-4 w-4 mr-2" />
						<Input
							type="text"
							placeholder="Search attendees..."
							bind:value={searchTerm}
							class="w-64"
						/>
					</div>
				</div>

				<ScrollArea class="h-96">
					{#if loading}
						<div class="flex justify-center py-8">
							<div class="text-gray-500">Loading announcement status...</div>
						</div>
					{:else}
						<Tabs.Root value="seen-announcements" class="w-full">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="seen-announcements" class="flex items-center">
									<Check class="h-4 w-4 mr-2 text-green-500" />
									Seen ({attendeesSeen.length})
								</Tabs.Trigger>
								<Tabs.Trigger value="unseen-announcements" class="flex items-center">
									<X class="h-4 w-4 mr-2 text-red-500" />
									Unseen ({attendeesUnseen.length})
								</Tabs.Trigger>
							</Tabs.List>

							<Tabs.Content value="seen-announcements" class="mt-4">
								{#if filteredSeenAttendees.length === 0}
									<div class="text-center py-8 text-gray-500">
										{searchTerm ? 'No seen announcements match your search.' : 'No one has seen this announcement yet.'}
									</div>
								{:else}
									<div class="space-y-3">
										{#each filteredSeenAttendees as attendee}
											<div class="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
												<div class="flex items-center">
													<Check class="h-5 w-5 text-green-500 mr-3" />
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

							<Tabs.Content value="unseen-announcements" class="mt-4">
								{#if filteredUnseenAttendees.length === 0}
									<div class="text-center py-8 text-gray-500">
										{searchTerm ? 'No unseen announcements match your search.' : 'All attendees have seen this announcement!'}
									</div>
								{:else}
									<div class="space-y-3">
										{#each filteredUnseenAttendees as attendee}
											<div class="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
												<div class="flex items-center">
													<X class="h-5 w-5 text-red-500 mr-3" />
													<div>
														<div class="font-medium">
															{attendee.user?.username || attendee.name || 'Unknown User'}
														</div>
														{#if attendee.user?.email}
															<div class="text-sm text-gray-500">{attendee.user.email}</div>
														{/if}
													</div>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</Tabs.Content>
						</Tabs.Root>
					{/if}
				</ScrollArea>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
