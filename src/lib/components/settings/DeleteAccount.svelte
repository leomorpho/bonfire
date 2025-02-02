<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { getFeTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { page } from '$app/stores';
	import Loader from '../Loader.svelte';
	import { sleep } from '$lib/utils';

	// Constant to toggle between real deletion and fake deletion for testing
	const REAL_DELETION = true;

	let isOpen = $state(false);


	// TODO: create a triplit table where we upload the progress, or use a websocket or SSE
	let isDeleting = $state(false);
	let deletionProgress = $state(0);

	const handleDeleteAccount = async () => {
		isOpen = false;

		const client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		try {
			const userId = $page.data.user.id;

			isDeleting = true;
			deletionProgress = 0;

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
		<Button class="w-full bg-red-500 hover:bg-red-400">Delete account</Button>
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
			<Loader/>
			<!-- <div class="h-2 rounded bg-gray-200">
				<div
					class="h-full rounded bg-red-500 transition-all duration-300"
					style="width: {deletionProgress}%"
				></div>
			</div>
			<p class="mt-2 text-center text-sm">{deletionProgress.toFixed(0)}% complete</p> -->
		</div>
	</div>
{/if}
