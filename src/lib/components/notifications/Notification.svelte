<script lang="ts">
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { TriplitClient } from '@triplit/client';
	import { formatHumanReadable, stringRepresentationToArray } from '$lib/utils';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { notification } = $props();

	let linkedObjects = $state([]);
	let isLoading = $state(true);
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling

	const maxNumAttendeesToShowInline = 3;

	const fetchLinkedObjects = async () => {
		if (!notification.object_ids || !notification.object_type) return;

		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		const objectIds = stringRepresentationToArray(notification.object_ids);

		let query;
		switch (notification.object_type) {
			case 'announcement':
				query = client.query('announcement').where(['id', 'in', objectIds]).build();
				break;
			case 'files':
				query = client.query('files').where(['id', 'in', objectIds]).build();
				break;
			case 'attendees':
				query = client.query('attendees').include('user').where(['id', 'in', objectIds]).build();
				break;
			default:
				console.error(`Unknown object_type: ${notification.object_type}`);
				return;
		}

		const results = await client.fetch(query);

		// Fetch profile images for attendees
		if (notification.object_type === 'attendees') {
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
		console.log('results', results);

		linkedObjects = results;
		isLoading = false;
	};

	const markAsRead = async () => {
		if (notification.seen_at) return;

		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;

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

<div class="notification-item rounded border p-4 rounded-lg" bind:this={cardRef}>
	<!-- Display message -->
	<p class="font-medium">{notification.message}</p>

	<!-- Display additional metadata -->
	<p class="text-sm text-gray-500">
		{formatHumanReadable(notification.created_at)}
	</p>

	<!-- Show loading indicator while fetching linked objects -->
	{#if isLoading}
		<p class="text-gray-400">Loading details...</p>
	{:else}
		<!-- Render linked objects -->
		{#if linkedObjects.length > 0}
			<div>
				<!-- Customize rendering for each object type -->
				{#if notification.object_type === 'announcement'}
					<a
						href={`/bonfire/${notification.event_id}/announcement/${obj.id}`}
						class="text-blue-500 underline"
					>
						📢 {obj.title || 'Announcement'}
					</a>
				{:else if notification.object_type === 'files'}
					<a
						href={`/bonfire/${notification.event_id}/files/${obj.id}`}
						class="text-green-500 underline"
					>
						📁 {obj.name || 'File'}
					</a>
				{:else if notification.object_type === 'attendees'}
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
								{#each linkedObjects as attendee}
									<ProfileAvatar
										url={attendee.profileImage?.small_image_url}
										fullsizeUrl={attendee.profileImage?.full_image_url}
										username={attendee.user?.username}
										fallbackName={attendee.user?.username}
									/>
								{/each}
							</Collapsible.Content>
						</Collapsible.Root>
					{:else}
						<div class="grid grid-cols-4 gap-2">
							{#each linkedObjects as attendee}
								<ProfileAvatar
									url={attendee.profileImage?.small_image_url}
									fullsizeUrl={attendee.profileImage?.full_image_url}
									username={attendee.user?.username}
									fallbackName={attendee.user?.username}
								/>
							{/each}
						</div>
					{/if}
				{/if}
			</div>
		{:else}
			<p class="text-gray-400">No linked objects found.</p>
		{/if}
	{/if}
</div>
