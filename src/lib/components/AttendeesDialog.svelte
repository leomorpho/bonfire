<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Plus } from 'lucide-svelte';
	import { ScrollArea } from './ui/scroll-area';
	import ProfileAvatar from './ProfileAvatar.svelte';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';

	let {
		numAttendeesGoing,
		allAttendeesGoing,
		numAttendeesMaybeGoing,
		allAttendeesMaybeGoing,
		numAttendeesNotGoing,
		allAttendeesNotGoing,
		numAttendeesLeft,
		allAttendeesLeft,
		numAttendeesRemoved,
		allAttendeesRemoved,
		showMaxNumPeople = 30,
		isCurrenUserEventAdmin = false
	} = $props();

	let isDialogOpen = $state(false);
	let shouldLoadContent = $state(false);

	$effect(() => {
		if (isDialogOpen) {
			setTimeout(() => {
				shouldLoadContent = true;
			}, 50);
		} else {
			shouldLoadContent = false;
		}
	});
</script>

{#snippet attendees(attendees: any, numAttendees: number, statusName: string, attendeeType: string, showRemoveUser=true)}
	{#if attendees.length > 0}
		<div class="mb-3 mt-5">
			<h2 class="my-3 flex w-full justify-center font-semibold">
				{numAttendees}
				{statusName}
			</h2>
			<div class="mx-5 flex flex-wrap -space-x-4 text-black">
				{#each attendees as attendee (attendee.id + attendeeType)}
					<div animate:flip out:fade={{ duration: 300 }}>
						<ProfileAvatar
							userId={attendee.user_id}
							tempUserName={attendee.name}
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							attendanceId={attendee.id}
							numGuests={attendee.guest_count}
							{showRemoveUser}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/snippet}

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger
		id="see-attendees-dialog"
		class="flex items-center focus:outline-none focus-visible:ring-0"
		>{#if allAttendeesGoing.length > showMaxNumPeople}
			<div class="rounded-xl bg-white text-sm text-gray-500 dark:bg-slate-900 dark:text-gray-100">
				and {allAttendeesGoing.length - showMaxNumPeople} more
			</div>
		{/if}
		<div class="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
			<Plus class="ml-1 h-4 w-4 rounded-xl bg-white dark:bg-slate-900 sm:h-5 sm:w-5" />
		</div></Dialog.Trigger
	>
	<Dialog.Content class="h-full sm:h-[90vh]">
		{#if isDialogOpen && shouldLoadContent}
			<!-- Only load content when dialog is open -->
			<ScrollArea>
				<Dialog.Header>
					<Dialog.Title class="flex w-full justify-center">Attendees</Dialog.Title>
					<Dialog.Description>
						{@render attendees(allAttendeesGoing, numAttendeesGoing, 'going', 'going')}
						{@render attendees(
							allAttendeesMaybeGoing,
							numAttendeesMaybeGoing,
							'maybe',
							'maybe-going'
						)}
						{@render attendees(
							allAttendeesNotGoing,
							numAttendeesNotGoing,
							'not going',
							'not-going'
						)}
						{#if isCurrenUserEventAdmin}
							<div class="mt-10 rounded-xl bg-slate-200 py-3 dark:bg-slate-900">
								<div class="my-2 flex w-full justify-center">
									<div class="rounded-xl bg-yellow-100/50 dark:bg-yellow-800/50 p-2">
										Only visible to admins
									</div>
								</div>
								{@render attendees(allAttendeesLeft, numAttendeesLeft, 'left', 'left', false)}
								{@render attendees(allAttendeesRemoved, numAttendeesRemoved, 'removed', 'removed', false)}
							</div>
						{/if}
					</Dialog.Description>
				</Dialog.Header>
			</ScrollArea>
		{/if}
	</Dialog.Content>
</Dialog.Root>
