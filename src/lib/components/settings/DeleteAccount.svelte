<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';

	// Constant to toggle between real deletion and fake deletion for testing
	const REAL_DELETION = true;

	let isOpen = $state(false);

	// Sleep function
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	let isDeleting = $state(false);
	let deletionProgress = $state(0);

	const handleDeleteAccount = async () => {
		isOpen = false;

		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		try {
			const userId = $page.data.user.id;

			isDeleting = true;
			deletionProgress = 0;

			// Construct queries
			const filesQuery = client
				.query('files')
				.where(['uploader_id', '=', userId])
				.select(['id'])
				.build();
			const attendeesQuery = client
				.query('attendees')
				.where(['user_id', '=', userId])
				.select(['id'])
				.build();
			const eventsQuery = client
				.query('events')
				.where(['user_id', '=', userId])
				.select(['id'])
				.build();
			const notificationsQuery = client
				.query('notifications')
				.where(['user_id', '=', userId])
				.select(['id'])
				.build();
			const profileImagesQuery = client
				.query('profile_images')
				.where(['user_id', '=', userId])
				.select(['id'])
				.build();

			// Fetch data for deletion
			console.log('Fetching files for deletion...');
			const files = await client.fetch(filesQuery);
			console.log('Fetched files:', files);

			console.log('Fetching attendees for deletion...');
			const attendees = await client.fetch(attendeesQuery);
			console.log('Fetched attendees:', attendees);

			console.log('Fetching events for deletion...');
			const events = await client.fetch(eventsQuery);
			console.log('Fetched events:', events);

			console.log('Fetching notifications for deletion...');
			const notifications = await client.fetch(notificationsQuery);
			console.log('Fetched notifications:', notifications);

			console.log('Fetching profile images for deletion...');
			const profileImages = await client.fetch(profileImagesQuery);
			console.log('Fetched profile images:', profileImages);

			// Total items to delete
			const totalItems =
				files.length +
				attendees.length +
				events.length +
				notifications.length +
				profileImages.length +
				1; // +1 for user account

			let deletedItems = 0;

			const updateProgress = () => {
				deletedItems += 1;
				deletionProgress = (deletedItems / totalItems) * 100;
			};

			// Perform deletions
			await client.transact(async (tx) => {
				for (const file of files) {
					if (REAL_DELETION) {
						await tx.delete('files', file.id);
					} else {
						await sleep(300); // Simulate delete delay
					}
					updateProgress();
				}
				for (const attendee of attendees) {
					if (REAL_DELETION) {
						await tx.delete('attendees', attendee.id);
					} else {
						await sleep(300); // Simulate delete delay
					}
					updateProgress();
				}
				for (const event of events) {
					if (REAL_DELETION) {
						await tx.delete('events', event.id);
					} else {
						await sleep(300); // Simulate delete delay
					}
					updateProgress();
				}
				for (const notification of notifications) {
					if (REAL_DELETION) {
						await tx.delete('notifications', notification.id);
					} else {
						await sleep(300); // Simulate delete delay
					}
					updateProgress();
				}
				for (const profileImage of profileImages) {
					if (REAL_DELETION) {
						await tx.delete('profile_images', profileImage.id);
					} else {
						await sleep(300); // Simulate delete delay
					}
					updateProgress();
				}

				// Delete the user account
				if (REAL_DELETION) {
					await tx.delete('user', userId);
				} else {
					await sleep(300); // Simulate delete delay
				}
				updateProgress();
			});

			if (REAL_DELETION) {
				// Call DELETE endpoint to remove user and related data
				const response = await fetch('/settings/account_deletion', {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				if (!response.ok) {
					const errorResponse = await response.json();
					throw new Error(errorResponse.message || 'Failed to delete account');
				}

				toast.success('Your account and data were successfully deleted');
				await sleep(300);
				await signOut(); // Sign out the user after successful deletion
				return;
			}

			// Redirect after deletion
			toast.success('Your account and data were successfully deleted');
			// await sleep(300);
			// signOut();
		} catch (error) {
			toast.success('Failed to delete account. Please try again, or contact support.');

			console.error('Error deleting account:', error);
		} finally {
			isDeleting = false;
		}
	};

	async function signOut() {
		try {
			const response = await fetch('/login?/signout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded' // Ensure compatibility
				},
				body: '' // Body is required for some servers even if it's empty
			});

			if (response.ok) {
				// Redirect to home or refresh the page after successful signout
				window.location.href = '/';
			} else {
				// Handle errors (e.g., unauthorized, server issues)
				console.error('Failed to sign out:', await response.text());
			}
		} catch (error) {
			console.error('Error during sign out:', error);
		}
	}
</script>

<AlertDialog.Root bind:open={isOpen}>
	<AlertDialog.Trigger class="w-full">
		<Button class="w-full bg-red-500 hover:bg-red-400">Delete Account</Button>
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete your account and remove your data
				from our servers.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={handleDeleteAccount}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Deletion progress overlay -->
{#if isDeleting}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
		<div class="w-1/2">
			<p class="mb-4 text-center text-lg">Deleting account...</p>
			<div class="h-2 rounded bg-gray-200">
				<div
					class="h-full rounded bg-red-500 transition-all duration-300"
					style="width: {deletionProgress}%"
				></div>
			</div>
			<p class="mt-2 text-center text-sm">{deletionProgress.toFixed(0)}% complete</p>
		</div>
	</div>
{/if}
