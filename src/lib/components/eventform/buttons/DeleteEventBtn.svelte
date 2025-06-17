<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Trash2, AlertTriangle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { submitDisabled, currUserId, eventCreatorUserId, eventId, eventTitle } = $props();

	// Deletion state
	let deleting = $state(false);
	let deleteConfirmationName = $state('');

	// Enable delete button only when confirmation name matches
	const deleteButtonEnabled = $derived(
		deleteConfirmationName.trim() === eventTitle && !deleting
	);

	const deleteEvent = async () => {
		if (!deleteButtonEnabled) {
			return;
		}

		deleting = true;
		try {
			const response = await fetch(`/bonfire/${eventId}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					eventName: eventTitle,
					confirmationName: deleteConfirmationName.trim()
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete event');
			}

			toast.success(result.message || 'Event deleted successfully');
			console.log('Event deleted:', eventId);
			goto('/');
		} catch (error) {
			console.error('Error deleting event:', error);
			toast.error('Failed to delete event. Please try again.');
		} finally {
			deleting = false;
		}
	};

	function resetDialog() {
		deleteConfirmationName = '';
	}
</script>

<Dialog.Root onOpenChange={resetDialog}>
	<Dialog.Trigger
		id="delete-event-btn"
		class="flex w-full sm:w-fit"
		disabled={submitDisabled || currUserId != eventCreatorUserId}
		><Button
			disabled={submitDisabled || currUserId != eventCreatorUserId}
			class="w-full bg-red-700 ring-glow hover:bg-red-600 dark:bg-red-800 dark:text-white dark:hover:bg-red-700"
		>
			<Trash2 class="ml-1 mr-1 h-4 w-4" />
			<span class="block sm:hidden">Delete</span>
		</Button></Dialog.Trigger
	>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2 text-red-600 dark:text-red-400">
				<AlertTriangle class="h-5 w-5" />
				Permanently Delete Event?
			</Dialog.Title>
			<Dialog.Description>
				<div class="space-y-4">
					<p class="font-semibold text-red-600 dark:text-red-400">
						This will completely and permanently delete the event and ALL associated data including:
					</p>
					<ul class="list-disc space-y-1 pl-5 text-sm">
						<li>All messages and announcements</li>
						<li>All uploaded files and images</li>
						<li>All attendee data and RSVPs</li>
						<li>Bring list items and assignments</li>
						<li>Event history and settings</li>
					</ul>
					<p class="font-bold text-red-700 dark:text-red-300">
						All attendees will be notified that the event has been deleted.
					</p>
					<p class="font-bold">
						This action is <span class="text-red-600 dark:text-red-400">IRREVERSIBLE</span>.
					</p>

					<div class="space-y-2">
						<p class="text-sm font-medium">
							To confirm deletion, please type the event name:
						</p>
						<p class="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">
							{eventTitle}
						</p>
						<Input
							bind:value={deleteConfirmationName}
							placeholder="Type the event name here"
							class="font-mono"
						/>
					</div>
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex flex-col gap-2 sm:flex-row">
			<Dialog.Close>
				<Button variant="outline" class="w-full sm:w-auto">
					Cancel
				</Button>
			</Dialog.Close>
			<Button
				id="confirm-delete-event"
				disabled={!deleteButtonEnabled}
				class="flex w-full items-center gap-2 bg-red-600 text-white hover:bg-red-500 sm:w-auto"
				onclick={deleteEvent}
			>
				<Trash2 class="h-4 w-4" />
				{deleting ? 'Deleting...' : 'Yes, Permanently Delete Event'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
