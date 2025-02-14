<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { Pencil } from 'lucide-svelte';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import ProfileAvatar from './ProfileAvatar.svelte';

	let {
		eventId,
		currUserId,
		currentUserAttendeeId,
		announcement,
		isUnverifiedUser = false,
		currenUserIsEventAdmin = false
	} = $props();
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling

	async function markAsSeen() {
		if (isUnverifiedUser) {
			return;
		}

		if (announcement.seen_by.length != 0) return;

		const client = getFeTriplitClient($page.data.jwt);

		try {
			// Insert new seen_announcements record
			await client.insert('seen_announcements', {
				attendee_id: currentUserAttendeeId,
				announcement_id: announcement.id,
				seen_at: new Date()
			});
			console.log(
				`Announcement ${announcement.id} marked as seen for attendee ${currentUserAttendeeId}`
			);
		} catch (err) {
			console.error(`Error marking announcement ${announcement.id} as seen:`, err);
		}
	}

	// Setup IntersectionObserver
	onMount(() => {
		const observer = new IntersectionObserver(
			async ([entry]) => {
				if (entry.isIntersecting) {
					await markAsSeen(); // Mark as seen when visible
					observer.disconnect(); // Disconnect observer after marking
				}
			},
			{ threshold: 0.5 } // Trigger when at least 50% of the card is visible
		);

		// Ensure cardRef is a valid HTMLElement
		if (cardRef instanceof HTMLElement) {
			observer.observe(cardRef);
		} else {
			console.error('cardRef is not a valid HTMLElement:', cardRef);
		}

		// Cleanup observer
		return () => observer.disconnect();
	});
</script>

<Card.Root
	class="announcement border-0 bg-opacity-90 dark:bg-opacity-90 {announcement.seen_by.length == 0 &&
	!isUnverifiedUser
		? 'bg-yellow-200 dark:bg-yellow-700'
		: 'bg-slate-200 dark:bg-slate-800'} dark:text-white "
>
	<Card.Header>
		<Card.Title class="flex font-normal">
			<div class="mr-2">
				<ProfileAvatar userId={announcement.user_id} baseHeightPx={30} />
			</div>
			{announcement.content}
		</Card.Title>
		<Card.Description
			><div bind:this={cardRef}>
				{formatHumanReadable(announcement.created_at)}
			</div></Card.Description
		>
	</Card.Header>
	<Card.Footer>
		{#if currUserId == announcement.user_id || currenUserIsEventAdmin}
			<a href={`/bonfire/${eventId}/announcement/${announcement.id}/update`}
				><Button class="mt-2 rounded-xl" variant="outline"><Pencil class="h-4 w-4" /></Button></a
			>
		{/if}
	</Card.Footer>
</Card.Root>
