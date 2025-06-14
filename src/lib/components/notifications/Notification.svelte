<script lang="ts">
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { TriplitClient } from '@triplit/client';
	import { formatHumanReadable, stringRepresentationToArray } from '$lib/utils';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Announcement from '../announcements/Announcement.svelte';
	import { NotificationType } from '$lib/enums';
	// import Message from '../im/Message.svelte';
	import MessageContent from '../im/MessageContent.svelte';
	import { MoreHorizontal } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { fade, slide } from 'svelte/transition';

	let { notification, toggleDialog, deleteNotification, isCurrenUserEventAdmin = false } = $props();

	console.log('notification', notification);

	let userId = $state('');
	let linkedObjects = $state([]);
	let isLoading = $state(true);
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling
	let eventTitle = $state('...');
	let hideNotification = $state(false);

	const maxNumAttendeesToShowInline = 3;

	const fetchLinkedObjects = async () => {
		// console.log('notification', notification);
		if (
			!(notification.object_ids || notification.object_ids_set || notification.object_ids_set) ||
			!notification.object_type
		)
			return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		// TODO: below work is due to new field for set
		const objectIdsSet1 = new Set(stringRepresentationToArray(notification.object_ids));
		const objectIdsSet2 = notification.object_ids_set;
		objectIdsSet2.forEach((id: string) => objectIdsSet1.add(id));

		// Step 3: Convert the combined set to an array
		const objectIds = Array.from(objectIdsSet1);

		let query;
		switch (notification.object_type) {
			case NotificationType.ANNOUNCEMENT:
				query = client
					.query('announcement')
					.Include('seen_by')
					.Where(['id', 'in', objectIds])
					.Order('created_at', 'DESC');
				break;
			case NotificationType.FILES:
				// Don't query the files, just redirect to event
				isLoading = false;
				// query = client.query('files').Where(['id', 'in', objectIds]);
				return;
			case NotificationType.ATTENDEES:
				query = client.query('attendees').Include('user').Where(['id', 'in', objectIds]);
				break;
			case NotificationType.TEMP_ATTENDEES:
				query = client.query('temporary_attendees').Where(['id', 'in', objectIds]);
				break;
			case NotificationType.YOU_WERE_ADDED_AS_ADMIN:
				// Nothing needed
				isLoading = false;
				return;
			case NotificationType.ADMIN_ADDED:
				query = client.query('user').Where(['id', 'in', objectIds]);
				break;
			case NotificationType.NEW_MESSAGE:
				query = client
					.query('event_messages')
					.Where(['id', 'in', objectIds])
					.Include('user')
					.Include('emoji_reactions', (rel) =>
						rel('emoji_reactions').Select(['id', 'emoji', 'user_id'])
					);
				break;
			default:
				console.error(`Unknown object_type: ${notification.object_type}`);
				return;
		}

		const results = await client.fetch(query);

		if (objectIds.length > 0 && results.length == 0) {
			isLoading = false;
			return;
		}

		// Fetch profile images for attendees
		if (notification.object_type === NotificationType.ATTENDEES) {
			const userIds = results.map((attendee) => attendee.user_id);
			const profileResponse = await fetch(
				`/profile/profile-images?${new URLSearchParams({ userIds })}`
			);
			const profileImageMap = await profileResponse.json();

			// Assign profile images to attendees
			results.forEach((attendee) => {
				attendee.profileImage = profileImageMap[attendee.user_id] || {};
			});
		}

		// Fetch attendee ID
		if (notification.object_type === NotificationType.ANNOUNCEMENT) {
			// Collect unique event_ids from announcements
			const eventIds = [...new Set(results.map((announcement) => announcement.event_id))];

			// Query attendees table for all relevant event_id and user_id combinations
			const attendeeQuery = client.query('attendees').Where([
				['user_id', '=', userId],
				['event_id', 'in', eventIds]
			]);
			// Fetch all relevant attendees
			const attendees = await client.fetch(attendeeQuery);

			// Map event_id to attendeeId for quick lookup
			const attendeeMap = new Map(attendees.map((attendee) => [attendee.event_id, attendee.id]));

			// Assign attendeeId to each announcement object
			results.forEach((announcement) => {
				announcement.attendeeId = attendeeMap.get(announcement.event_id) || null;
			});
		}

		// console.log('results', results);

		linkedObjects = results;
		isLoading = false;
	};

	const markAsRead = async () => {
		if (notification.seen_at) return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		try {
			// Update the notification as read
			await client.http.update('notifications', notification.id, async (entity) => {
				entity.seen_at = new Date();
			});
			console.log(`Notification ${notification.id} marked as read.`);
		} catch (err) {
			console.error(`Error marking notification ${notification.id} as read:`, err);
		}
	};

	onMount(fetchLinkedObjects);

	onMount(() => {
		const init = async () => {
			userId = (await waitForUserId()) as string;
		};
		init();

		const getEventTitle = async () => {
			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

			const event = await client.fetchOne(
				client.query('events').Where(['id', '=', notification.event_id]).Select(['title'])
			);

			eventTitle = event?.title;
		};

		getEventTitle();

		const observer = new IntersectionObserver(
			async ([entry]) => {
				if (entry.isIntersecting) {
					await markAsRead(); // Mark as read when visible
					observer.disconnect(); // Disconnect observer after marking
				}
			},
			{ threshold: 0.5 } // Trigger when at least 50% of the card is visible
		);

		if (cardRef instanceof HTMLElement) {
			observer.observe(cardRef);
		} else {
			console.error('cardRef is not a valid HTMLElement:', cardRef);
		}

		// Cleanup observer
		return () => observer.disconnect();
	});
</script>

<div
	class={`${hideNotification ? 'hidden' : ''} notification-item reltive relative mt-3 rounded-lg bg-slate-200 p-4 dark:bg-slate-900`}
	bind:this={cardRef}
	in:slide={{ duration: 300 }}
	out:slide={{ duration: 100 }}
>
	<DropdownMenu.Root>
		<DropdownMenu.Trigger class="absolute right-2 top-1"
			><MoreHorizontal class="h-4 w-4" /></DropdownMenu.Trigger
		>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Item
					onclick={() => {
						deleteNotification(notification.id);
					}}>Delete</DropdownMenu.Item
				>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Display additional metadata -->
	<p class="mb-1 text-xs text-gray-500">
		{formatHumanReadable(notification.created_at)}
	</p>

	<!-- Display message -->
	<p class="font-medium">
		{notification.message} in
		<a
			href={`/bonfire/${notification.event_id}`}
			onclick={toggleDialog}
			class="italic text-blue-500 hover:underline"
			>{eventTitle}:
		</a>
	</p>

	<!-- Show loading indicator while fetching linked objects -->
	{#if isLoading}
		<p class="text-gray-400">Loading details...</p>
	{:else if linkedObjects.length === 0 && (notification.object_type === NotificationType.ATTENDEES || notification.object_type === NotificationType.TEMP_ATTENDEES)}
		<p class="text-gray-500 italic">Looks like the associated data was deleted by the author</p>
	{:else}
		<!-- Render linked objects -->
		{#if notification.object_type === NotificationType.FILES}
			<a
				class="my-2 flex w-full justify-center"
				href={`/bonfire/${notification.event_id}/media/gallery`}
				onclick={toggleDialog}
			>
				<Button class="mt-3">See event images</Button>
			</a>
		{:else if notification.object_type == NotificationType.YOU_WERE_ADDED_AS_ADMIN}
			<a
				class="my-2 flex w-full justify-center"
				href={`/bonfire/${notification.event_id}`}
				onclick={toggleDialog}
			>
				<Button class="mt-3">See event</Button>
			</a>
		{/if}
		{#if linkedObjects.length > 0}
			<div class="mt-3">
				<!-- Customize rendering for each object type -->
				{#if notification.object_type === NotificationType.ANNOUNCEMENT}
					{#each linkedObjects as obj}
						<div class="my-2">
							<Announcement
								eventId={obj.event_id}
								currUserId={userId}
								currentUserAttendeeId={obj.attendeeId}
								announcement={obj}
							/>
						</div>
					{/each}
				{:else if notification.object_type === NotificationType.NEW_MESSAGE}
					<!-- Show the first two messages -->
					{#each linkedObjects.slice(0, 2) as message}
						<div class="my-2 flex w-full items-center justify-center space-x-3">
							<ProfileAvatar userId={message.user.id} baseHeightPx={30} />
							<MessageContent
								class="rounded-xl"
								username={message.user?.username}
								content={message.content}
								created_at={message.created_at}
								deleted_by_user_id={message.deleted_by_user_id}
							/>
						</div>
					{/each}
					{#if linkedObjects.length > 2}
						<!-- Indicate additional messages -->
						<div class="my-2 flex w-full items-center justify-center space-x-3 text-gray-500">
							...and a few more
						</div>
					{/if}
				{:else if notification.object_type === NotificationType.ADMIN_ADDED}
					<div class="mx-5 flex flex-wrap justify-center -space-x-1 text-black">
						{#each linkedObjects as user}
							<div in:fade={{ duration: 300 }}>
								<ProfileAvatar userId={user.id} viewerIsEventAdmin={isCurrenUserEventAdmin} />
							</div>
						{/each}
					</div>
				{:else if notification.object_type === NotificationType.ATTENDEES}
					{#if linkedObjects.length > maxNumAttendeesToShowInline}
						<Collapsible.Root class="space-y-2">
							<div class="flex items-center justify-between space-x-4 px-4">
								<h4 class="text-sm font-semibold">
									See {linkedObjects.length} attendees
								</h4>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Button variant="ghost" size="sm" class="w-9 p-0" {...props}>
											<ChevronsUpDown />
											<span class="sr-only">Toggle</span>
										</Button>
									{/snippet}
								</Collapsible.Trigger>
							</div>
							<!-- Show the rest in the collapsible content -->
							<Collapsible.Content class="text-black">
								<div class="mx-5 flex flex-wrap justify-center -space-x-1 text-black">
									{#each linkedObjects as attendee}
										<ProfileAvatar
											userId={attendee.user_id}
											viewerIsEventAdmin={isCurrenUserEventAdmin}
										/>
									{/each}
								</div>
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						<div class="mx-5 flex flex-wrap justify-center -space-x-1 text-black">
							{#each linkedObjects as attendee}
								<ProfileAvatar
									userId={attendee.user_id}
									viewerIsEventAdmin={isCurrenUserEventAdmin}
								/>
							{/each}
						</div>
					{/if}
				{:else if notification.object_type === NotificationType.TEMP_ATTENDEES}
					{#if linkedObjects.length > maxNumAttendeesToShowInline}
						<Collapsible.Root class="space-y-2">
							<div class="flex items-center justify-between space-x-4 px-4">
								<h4 class="text-sm font-semibold">
									See {linkedObjects.length} attendees
								</h4>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Button variant="ghost" size="sm" class="w-9 p-0" {...props}>
											<ChevronsUpDown />
											<span class="sr-only">Toggle</span>
										</Button>
									{/snippet}
								</Collapsible.Trigger>
							</div>
							<!-- Show the rest in the collapsible content -->
							<Collapsible.Content>
								<div class="flex flex-wrap space-x-1 space-y-1">
									{#each linkedObjects as attendee}
										<ProfileAvatar tempUserName={attendee.name} />
									{/each}
								</div>
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						<div class="grid grid-cols-4 gap-2">
							{#each linkedObjects as attendee}
								<ProfileAvatar tempUserName={attendee.name} />
							{/each}
						</div>
					{/if}{/if}
			</div>
		{/if}
	{/if}
</div>
