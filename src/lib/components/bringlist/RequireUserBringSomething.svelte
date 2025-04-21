<script lang="ts">
	import { goto } from '$app/navigation';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import BringItemProgressBar from './BringItemProgressBar.svelte';

	let {
		eventId,
		currUserId,
		tempAttendeeId,
		bringItems,
		numAttendeesGoing,
		isAdmin,
		isDialogOpen = false,
		isUserBringingSomething = false
	} = $props();

	const redirectToDashboard = () => {
		goto('/dashboard');
	};
</script>

<AlertDialog.Root bind:open={isDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>🍽 Contribute to the Event</AlertDialog.Title>
			<AlertDialog.Description>
				<p class="text-base">
					To ensure everyone participates in this potluck-style event, please select at least one
					item from the list below to bring! 🍴🍲
				</p>
				<div class="my-2">
					{#each bringItems as item (item.id)}
						<BringItemProgressBar
							{eventId}
							{item}
							{numAttendeesGoing}
							currUserId={currUserId ? currUserId : tempAttendeeId}
							isTempUser={!currUserId}
							{isAdmin}
						/>
					{/each}
				</div>
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={redirectToDashboard}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action disabled={!isUserBringingSomething}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
