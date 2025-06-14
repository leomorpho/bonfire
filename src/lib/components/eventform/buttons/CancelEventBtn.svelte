<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Ban } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { submitDisabled, currUserId, eventCreatorUserId, eventId } = $props();

	const cancelEvent = async (e: Event) => {
		try {
			const response = await fetch(`/bonfire/${eventId}/cancel`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Failed to cancel event');
			}

			if (result.deleted) {
				toast.success('Event deleted successfully (no attendees to notify)');
			} else if (result.cancelled) {
				toast.success(`Event cancelled. ${result.attendeesNotified} attendees will be notified.`);
			}

			console.log('Event cancelled:', eventId);
			goto('/dashboard');
		} catch (error) {
			console.error('Error cancelling event:', error);
			toast.error('Failed to cancel event. Please try again.');
		}
	};
</script>

<Dialog.Root>
	<Dialog.Trigger
		id="cancel-event-btn"
		class="flex w-full sm:w-fit"
		disabled={submitDisabled || currUserId != eventCreatorUserId}
		><Button
			disabled={submitDisabled || currUserId != eventCreatorUserId}
			class="w-full bg-red-600 ring-glow hover:bg-red-500 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
		>
			<Ban class="ml-1 mr-1 h-4 w-4" />
			<span class="block sm:hidden">Cancel</span>
		</Button></Dialog.Trigger
	>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Cancel this event?</Dialog.Title>
			<Dialog.Description>
				This will cancel the event and notify all attendees. If there are no attendees, the event
				will simply be deleted. This action <span class="font-bold">cannot</span> be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer
			><Button
				id="confirm-cancel-event"
				disabled={submitDisabled}
				class="mt-2 w-full bg-red-500 hover:bg-red-400"
				onclick={cancelEvent}
			>
				<Ban class="ml-1 mr-1 h-4 w-4" /> Cancel Event
			</Button></Dialog.Footer
		>
	</Dialog.Content>
</Dialog.Root>
