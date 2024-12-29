<script lang="ts">
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { TriplitClient } from '@triplit/client';

	let { notification } = $props();

	let linkedObjects = $state();
	let isLoading = $state(true);
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling

	const fetchLinkedObjects = async () => {
		if (!notification.object_ids || !notification.object_type) return;

		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		const objectIds = notification.object_ids.split(',');

		let query;
		switch (notification.object_type) {
			case 'announcement':
				query = client.query('announcement').where(['id', 'in', objectIds]).build();
				break;
			case 'files':
				query = client.query('files').where(['id', 'in', objectIds]).build();
				break;
			case 'attendees':
				query = client.query('attendees').where(['id', 'in', objectIds]).build();
				break;
			default:
				console.error(`Unknown object_type: ${notification.object_type}`);
				return;
		}

		linkedObjects = await client.fetch(query);
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

<div class="notification-item rounded border p-4" bind:this={cardRef}>
	<!-- Display message -->
	<p class="font-medium">{notification.message}</p>

	<!-- Display additional metadata -->
	<p class="text-sm text-gray-500">
		{new Date(notification.created_at).toLocaleString()}
	</p>

	<!-- Show loading indicator while fetching linked objects -->
	{#if isLoading}
		<p class="text-gray-400">Loading details...</p>
	{:else}
		<!-- Render linked objects -->
		{#if linkedObjects.length > 0}
			<div>
				{#each linkedObjects as obj}
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
						<p class="text-purple-500">
							👥 {obj.name || 'Attendee'}
						</p>
					{/if}
				{/each}
			</div>
		{:else}
			<p class="text-gray-400">No linked objects found.</p>
		{/if}
	{/if}
</div>
