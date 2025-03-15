<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { getFeHttpTriplitClient } from '$lib/triplit';
	import { Trash2 } from 'lucide-svelte';

	let { submitDisabled, currUserId, eventCreatorUserId, eventId } = $props();

	const deleteEvent = async (e: Event) => {
		const feHttpClient = getFeHttpTriplitClient($page.data.jwt);
		try {
			feHttpClient
				.delete('events', eventId)
				.then(() => {
					console.log('Event deleted:', eventId);
					goto('/dashboard');
				})
				.catch((error: any) => {
					console.error('Error deleting event:', error);
				});
		} catch (error) {
			console.error('Error deleting event:', error);
		}
	};
</script>

<Dialog.Root>
	<Dialog.Trigger class="w-full" disabled={submitDisabled || currUserId != eventCreatorUserId}
		><Button
			disabled={submitDisabled || currUserId != eventCreatorUserId}
			class="mt-2 w-full bg-red-500 ring-glow hover:bg-red-400 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
		>
			<Trash2 class="ml-1 mr-1 h-4 w-4" /> Delete
		</Button></Dialog.Trigger
	>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				Once deleted, this bonfire is gone forever 🔥. This action <span class="font-bold"
					>cannot</span
				>
				be undone, and you <span class="font-bold">won’t get back</span> the log token used to
				create it. If you just need changes, consider
				<span class="font-bold">editting</span> instead.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer
			><Button
				disabled={submitDisabled}
				class="mt-2 w-full bg-red-500 hover:bg-red-400"
				onclick={deleteEvent}
			>
				<Trash2 class="ml-1 mr-1 h-4 w-4" /> Crush it
			</Button></Dialog.Footer
		>
	</Dialog.Content>
</Dialog.Root>
