<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { Pencil } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import ProfileAvatar from './ProfileAvatar.svelte';

	let {
		eventId,
		currUserId,
		currentUserAttendeeId,
		announcement,
		isUnverifiedUser = false,
		isCurrenUserEventAdmin = false
	} = $props();
	let cardRef: HTMLElement | null = $state(null); // Initialize as null to ensure proper type handling

	async function markAsSeen() {
		if (isUnverifiedUser) {
			return;
		}

		if (announcement.seen_by.length != 0) return;

		const client = getFeWorkerTriplitClient($page.data.jwt);

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
	class="announcement relative border-0 bg-opacity-90 pb-2 dark:bg-opacity-90 {announcement.seen_by
		.length == 0 && !isUnverifiedUser
		? 'bg-yellow-200 dark:bg-yellow-700'
		: 'bg-slate-200 dark:bg-slate-800'} dark:text-white"
>
	<!-- Edit Button Positioned Absolutely -->
	{#if currUserId == announcement.user_id || isCurrenUserEventAdmin}
		<a
			href={`/bonfire/${eventId}/announcement/${announcement.id}/update`}
			class="update-announcement absolute right-2 top-2"
		>
			<Button class="rounded-xl p-2" variant="outline">
				<Pencil class="!h-4 !w-4" />
			</Button>
		</a>
	{/if}

	<Card.Header>
		<Card.Title class="flex font-normal">
			<div bind:this={cardRef} class="flex items-center justify-center w-full text-sm">
				<div class="mr-2">
					<ProfileAvatar userId={announcement.user_id} baseHeightPx={30} />
				</div>
				<div>
					{formatHumanReadable(announcement.created_at)}
				</div>
			</div>
		</Card.Title>
		<Card.Description class="pb-2">
			{announcement.content}
		</Card.Description>
	</Card.Header>
</Card.Root>
