<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { page } from '$app/stores';

	// Props for the page
	let { mode = 'update', announcement = null, eventId } = $props();

	let client: TriplitClient = $state();
	let userId = $state();

	// States for form fields
	let content = $state(announcement?.content ?? '');
	let submitDisabled = $state(true);

	onMount(async () => {
		client = getFeTriplitClient($page.data.jwt);
		userId = await waitForUserId();
	});

	$effect(() => {
		// Enable the submit button if all required fields are filled
		submitDisabled = !content || !eventId;
	});

	const handleSubmit = async (e: Event) => {
		e.preventDefault();

		if (!content || !eventId) return;

		if (mode === 'create') {
			// Create a new announcement
			const { output } = await client.insert('announcement', {
				content,
				event_id: eventId,
				user_id: userId // Use the authenticated user's ID
			});

			if (output) {
				goto(`/bonfire/${eventId}#announcements`);
			} else {
				console.error('Failed to create announcement');
			}
		} else if (mode === 'update' && announcement?.id) {
			// Update the existing announcement
			await client.update('announcement', announcement.id, async (entity) => {
				entity.content = content;
				entity.event_id = eventId;
			});
			goto(`/bonfire/${eventId}#announcements`);
		}
	};

	const deleteAnnouncement = async (e: Event) => {
		try {
			await client.delete('announcement', announcement.id);
			goto(`/bonfire/${eventId}#announcements`);
		} catch (error) {
			console.error('Error deleting announcement:', error);
		}
	};
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold bg-white p-2 rounded-xl">
			{mode === 'create' ? 'Create' : 'Update'} an Announcement
		</h2>
		<form class="space-y-4" onsubmit={handleSubmit}>
			<Textarea placeholder="Announcement Content" bind:value={content} class="w-full bg-white" />

			<Button disabled={submitDisabled} type="submit" class="w-full">
				{mode === 'create' ? 'Create Announcement' : 'Update Announcement'}
			</Button>
		</form>

		{#if mode === 'update'}
			<Dialog.Root>
				<Dialog.Trigger class="w-full">
					<Button class="mt-2 w-full bg-red-500 hover:bg-red-400">Delete Announcement</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Are you sure?</Dialog.Title>
						<Dialog.Description>
							This action cannot be undone. This will permanently delete the announcement.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Button class="mt-2 w-full bg-red-500 hover:bg-red-400" onclick={deleteAnnouncement}>
							Confirm Delete
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</section>
</div>
