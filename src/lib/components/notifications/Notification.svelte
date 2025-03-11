<script lang="ts">
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { TriplitClient } from '@triplit/client';
	import { formatHumanReadable, stringRepresentationToArray } from '$lib/utils';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Announcement from '../Announcement.svelte';
	import { NotificationType } from '$lib/enums';
	import Message from '../im/Message.svelte';
	import MessageContent from '../im/MessageContent.svelte';

	let { notification, toggleDialog, isCurrenUserEventAdmin = false } = $props();

	let userId = $state('');
	let linkedObjects = $state([]);
	let isLoading = $state(true);
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling

	const maxNumAttendeesToShowInline = 3;

	const fetchLinkedObjects = async () => {
		// console.log('notification', notification);
		if (!notification.object_ids || !notification.object_type) return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
		const objectIds = stringRepresentationToArray(notification.object_ids);

		let query;
		switch (notification.object_type) {
			case NotificationType.ANNOUNCEMENT:
				query = client
					.query('announcement')
					.Include('seen_by')
					.Where(['id', 'in', objectIds])
					.Order('created_at', 'DESC')
					;
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
			case NotificationType.ADMIN_ADDED:
				// Nothing needed
				isLoading = false;
				return;
			case NotificationType.NEW_MESSAGE:
				query = client
					.query('event_messages')
					.Where(['id', 'in', objectIds])
					.Include('user')
					.Include('emoji_reactions', (rel) =>
						rel('emoji_reactions').Select(['id', 'emoji', 'user_id'])
					)
					;
				break;
			default:
				console.error(`Unknown object_type: ${notification.object_type}`);
				return;
		}

		const results = await client.fetch(query);

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
			const attendeeQuery = client
				.query('attendees')
				.Where([
					['user_id', '=', userId],
					['event_id', 'in', eventIds]
				])
				;

			// Fetch all relevant attendees
			const attendees = await client.fetch(attendeeQuery);

			// Map event_id to attendeeId for quick lookup
			const attendeeMap = new Map(attendees.map((attendee) => [attendee.event_id, attendee.id]));

			// Assign attendeeId to each announcement object
			results.forEach((announcement) => {
				announcement.attendeeId = attendeeMap.get(announcement.event_id) || null;
			});
		}

		console.log('results', results);

		linkedObjects = results;
		isLoading = false;
	};

	const markAsRead = async () => {
		if (notification.seen_at) return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		try {
			// Update the notification as read
			await client.update('notifications', notification.id, async (entity) => {
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

<div class="notification-item rounded-lg border p-4" bind:this={cardRef}>
	<!-- Display message -->
	<p class="font-medium">{notification.message}</p>

	<!-- Display additional metadata -->
	{#if notification.object_type === 'attendees'}
		<p class="text-sm text-gray-500">
			{formatHumanReadable(notification.created_at)}
		</p>
	{/if}

	<!-- Show loading indicator while fetching linked objects -->
	{#if isLoading}
		<p class="text-gray-400">Loading details...</p>
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
		{:else if notification.object_type == NotificationType.ADMIN_ADDED}
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
						<a class="m-1" href={`/bonfire/${obj.event_id}`} onclick={toggleDialog}>
							<Announcement
								eventId={obj.event_id}
								currUserId={userId}
								currentUserAttendeeId={obj.attendeeId}
								announcement={obj}
							/>
						</a>
					{/each}
					<!-- {:else if notification.object_type === 'files'}
					<a class="my-2" href={`/bonfire/${obj.event_id}`} onclick={toggleDialog}>
						{notification.}
					</a> -->
				{:else if notification.object_type === NotificationType.NEW_MESSAGE}
					{#each linkedObjects as message}
						<a href={`/bonfire/${notification.event_id}`} onclick={toggleDialog}>
							<div class="flex w-full items-center justify-center space-x-3">
								<ProfileAvatar userId={message.user.id} baseHeightPx={30}/>
								<MessageContent
									username={message.user?.username}
									content={message.content}
									created_at={message.created_at}
									deleted_by_user_id={message.deleted_by_user_id}
								/>
							</div>
						</a>
					{/each}
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
								<div class="flex flex-wrap space-x-1 space-y-1">
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
						<div class="grid grid-cols-4 gap-2 text-black">
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
