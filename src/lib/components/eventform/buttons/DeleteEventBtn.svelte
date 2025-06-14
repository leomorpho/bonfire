<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { submitDisabled, currUserId, eventCreatorUserId, eventId } = $props();

	const deleteEvent = async (e: Event) => {
		try {
			const response = await fetch(`/bonfire/${eventId}/delete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to delete event');
			}

			toast.success(result.message || 'Event deleted successfully');
			console.log('Event deleted:', eventId);
			goto('/dashboard');
		} catch (error) {
			console.error('Error deleting event:', error);
			toast.error('Failed to delete event. Please try again.');
		}
	};
</script>

<Dialog.Root>
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
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>⚠️ Permanently Delete Event?</Dialog.Title>
			<Dialog.Description>
				<div class="space-y-2">
					<p class="font-semibold text-red-600 dark:text-red-400">
						This will completely and permanently delete the event and ALL associated data including:
					</p>
					<ul class="list-disc pl-5 space-y-1 text-sm">
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
				</div>
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer class="flex flex-col gap-2">
			<Button
				id="confirm-delete-event"
				disabled={submitDisabled}
				class="w-full bg-red-600 hover:bg-red-500 text-white"
				onclick={deleteEvent}
			>
				<Trash2 class="ml-1 mr-1 h-4 w-4" /> Yes, Permanently Delete Event
			</Button>
			<Dialog.Close>
				<Button variant="outline" class="w-full">
					Cancel
				</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>