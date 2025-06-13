<script lang="ts">
	import ScrollArea from '$lib/jsrepo/ui/scroll-area/scroll-area.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { onMount } from 'svelte';
	import { type TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import { Check } from 'lucide-svelte';
	import { X } from '@lucide/svelte';
	import AdminOnlySign from '../AdminOnlySign.svelte';

	let { children, announcementId, event_id } = $props();

	let attendeesSeen: any = $state();
	let loading = $state(true);
	let listView = $state(true);
	let searchTerm = $state('');

	// Fuzzy search function
	const fuzzyMatch = (searchText: string, targetText: string): boolean => {
		if (!searchText.trim()) return true;
		
		const search = searchText.toLowerCase();
		const target = targetText.toLowerCase();
		
		// Direct substring match gets priority
		if (target.includes(search)) return true;
		
		// Fuzzy character matching
		let searchIndex = 0;
		for (let i = 0; i < target.length && searchIndex < search.length; i++) {
			if (target[i] === search[searchIndex]) {
				searchIndex++;
			}
		}
		return searchIndex === search.length;
	};

	// Filter attendees based on search term
	const filterAttendees = (attendees: any[], searchTerm: string) => {
		if (!searchTerm.trim()) return attendees;
		
		return attendees.filter(attendee => {
			const name = attendee.user?.username || '';
			return fuzzyMatch(searchTerm, name);
		});
	};

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

{#snippet attendees(title: string, attendees: any, seen: boolean = false)}
	{@const filteredAttendees = filterAttendees(attendees, searchTerm)}
	<div class="mb-3 mt-5">
		<h2 class="my-3 flex w-full items-center justify-center font-semibold">
			{title}
			{#if seen}
				<Check class="ml-2 h-4 w-4 text-green-500" />
			{:else}
				<X class="ml-2 h-4 w-4 text-red-500" />
			{/if}
			{#if searchTerm.trim() && filteredAttendees.length !== attendees.length}
				<span class="ml-2 text-sm text-gray-500">({filteredAttendees.length} of {attendees.length})</span>
			{/if}
		</h2>
		<div class="mb-2 flex justify-center space-x-2">
			<button
				onclick={() => (listView = false)}
				class={!listView ? 'font-semibold text-blue-500' : 'text-gray-500'}>Grid</button
			>
			<button
				onclick={() => (listView = true)}
				class={listView ? 'font-semibold text-blue-500' : 'text-gray-500'}>List</button
			>
		</div>
		<div class="mb-2 px-5">
			<input
				type="text"
				bind:value={searchTerm}
				placeholder="Search attendees"
				class="mb-2 w-full rounded border px-2 py-1 dark:bg-gray-800 dark:text-white"
			/>
		</div>
		{#if filteredAttendees.length > 0}
			{#if !listView}
				<div class="mx-5 flex flex-wrap -space-x-4 text-black">
					{#each filteredAttendees as attendee (attendee.userId)}
						<div animate:flip out:fade={{ duration: 300 }}>
							<ProfileAvatar userId={attendee.userId} />
						</div>
					{/each}
				</div>
			{:else}
				<div class="mx-5 flex flex-col space-y-2 text-black">
					{#each filteredAttendees as attendee (attendee.userId)}
						<div class="flex items-center space-x-2">
							<ProfileAvatar 
								userId={attendee.userId} 
								baseHeightPx={60}
								showNameInline={true}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{:else if searchTerm.trim()}
			<div class="flex w-full justify-center">No attendees found matching "{searchTerm}"</div>
		{:else if seen}
			<div class="flex w-full justify-center">No one has seen this notification</div>
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
						<!-- {@render attendees('Unread', attendeesUnseen)} -->
					{/if}
				</ScrollArea>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
