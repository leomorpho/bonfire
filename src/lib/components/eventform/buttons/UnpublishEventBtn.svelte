<script lang="ts">
	import { page } from '$app/stores';
	import CustomAlertDialog from '$lib/components/CustomAlertDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getFeHttpTriplitClient } from '$lib/triplit';
	import { BookDashed } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { submitDisabled, eventId } = $props();

	let isEventSaving = $state(false);

	const unpublishEvent = async () => {
		if (isEventSaving) {
			return;
		}

		try {
			isEventSaving = true;
			const feHttpClient = getFeHttpTriplitClient($page.data.jwt);

			// Use the Triplit client to update the event's 'is_published' field.
			await feHttpClient.update('events', eventId, async (entity) => {
				entity.is_published = false;
			});
			toast.success('Event unpublished successfully!');
		} catch (error) {
			console.error('Error unpublishing event:', error);
			toast.error('Failed to unpublish event. Please try again.');
		} finally {
			isEventSaving = false;
		}
	};
</script>

<CustomAlertDialog
	continueCallback={() => unpublishEvent()}
	dialogDescription={'Once unpublished, the event will be hidden from all attendees and admins. You can republish it anytime.'}
	cls={'w-full'}
>
	<Button
		id="unpublish-bonfire"
		disabled={submitDisabled}
		class={`sticky top-2 mt-2 w-full ${submitDisabled ? 'bg-slate-400 dark:bg-slate-600' : 'bg-orange-500 hover:bg-orange-400 dark:bg-orange-700 dark:hover:bg-orange-600'} ring-glow dark:text-white`}
	>
		{#if isEventSaving}
			<span class="loading loading-spinner loading-xs ml-2"> </span>
		{/if}
		<BookDashed class="ml-1 mr-1 h-4 w-4" /> Unpublish
	</Button>
</CustomAlertDialog>
