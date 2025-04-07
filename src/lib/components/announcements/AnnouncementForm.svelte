<script lang="ts">
	import { HttpClient, TriplitClient } from '@triplit/client';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getFeHttpTriplitClient, waitForUserId } from '$lib/triplit';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { page } from '$app/stores';
	import { createNewAnnouncementNotificationQueueObject } from '$lib/notification_queue';

	// Props for the page
	let { mode = 'update', announcement = null, eventId } = $props();

	let client: TriplitClient | HttpClient | undefined = $state();
	let userId = $state();

	// States for form fields
	let content = $state(announcement?.content ?? '');
	let submitDisabled = $state(true);

	onMount(async () => {
		client = getFeHttpTriplitClient($page.data.jwt);
		userId = await waitForUserId();
	});

	$effect(() => {
		// Enable the submit button if all required fields are filled
		submitDisabled = !content || !eventId;
	});

	const handleSubmit = (e: Event) => {
		if (!client) {
			throw new Error('client is not instantiated');
		}

		e.preventDefault();

		if (!content || !eventId) return;

		if (mode === 'create') {
			// Create a new announcement
			client
				.insert('announcement', {
					content,
					event_id: eventId,
					user_id: userId // Use the authenticated user's ID
				})
				.then(async (output) => {
					console.log('output...', output);

					await createNewAnnouncementNotificationQueueObject(client, userId as string, eventId, [
						output?.id
					]);

					if (output) {
						goto(`/bonfire/${eventId}#announcements`);
					} else {
						console.error('Failed to create announcement');
					}
				})
				.catch((error) => {
					console.error('Error creating announcement:', error);
				});
		} else if (mode === 'update' && announcement?.id) {
			// Update the existing announcement
			client
				.update('announcement', announcement.id, async (entity) => {
					entity.content = content;
					entity.event_id = eventId;
				})
				.then(() => {
					goto(`/bonfire/${eventId}#announcements`);
				})
				.catch((error) => {
					console.error('Error updating announcement:', error);
				});
		}
	};

	const deleteAnnouncement = (e: Event) => {
		if (!client) {
			throw new Error('client is not instantiated');
		}

		client
			.fetch(
				client
					.query('seen_announcements')
					.Where(['announcement_id', '=', announcement.id])
					.Select(['id'])
			)
			.then((seen_announcements) => {
				// Use an inner async function to handle the deletions
				const deleteOperations = async () => {
					await client?.delete('announcement', announcement.id);
					// Delete all related seen_announcements
					for (const seen of seen_announcements) {
						await client?.delete('seen_announcements', seen.id);
					}
				};

				return deleteOperations();
			})
			.then(() => {
				goto(`/bonfire/${eventId}#announcements`);
			})
			.catch((error) => {
				console.error('Error deleting announcement:', error);
			});
	};

	const deleteAennouncement = async (e: Event) => {
		try {
			let seen_announcements = await client.fetch(
				client
					.query('seen_announcements')
					.Where(['announcement_id', '=', announcement.id])
					.Select(['id'])
			);

			await client.transact(async (tx) => {
				await tx.delete('announcement', announcement.id);
				// Delete all related seen_announcements
				for (const seen of seen_announcements) {
					await tx.delete('seen_announcements', seen.id);
				}
			});
			goto(`/bonfire/${eventId}#announcements`);
		} catch (error) {
			console.error('Error deleting announcement:', error);
		}
	};
</script>

<div class="mx-4 flex flex-col items-center justify-center">
	<section class="mt-8 w-full sm:w-[450px]">
		<div class="mb-5 rounded-lg bg-slate-200/70 p-2 text-sm dark:bg-slate-800/70">
			Announcements are delivered via SMS, email, or in-app notifications, based on your attendees'
			preferences.
		</div>
		<form class="space-y-4" onsubmit={handleSubmit}>
			<Textarea
				placeholder="Type your announcement here"
				bind:value={content}
				class="h-64 w-full bg-white dark:bg-slate-800 dark:text-white"
			/>

			<Button disabled={submitDisabled} type="submit" class="w-full ring-glow">
				{mode === 'create' ? 'Create' : 'Update'}
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
