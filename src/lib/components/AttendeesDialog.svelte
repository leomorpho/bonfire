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

<Dialog.Root bind:open={isDialogOpen}>
	<Dialog.Trigger class="flex items-center focus:outline-none focus-visible:ring-0"
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
						<div class="mb-3 mt-5">
							{#if allAttendeesGoing.length > 0}
								<h2 class="my-3 flex w-full justify-center font-semibold">
									{numAttendeesGoing} going
								</h2>
								<div class="mx-5 flex flex-wrap -space-x-4 text-black">
									{#each allAttendeesGoing as attendee (attendee.id)}
										<div animate:flip out:fade={{ duration: 300 }}>
											<ProfileAvatar
												userId={attendee.user_id}
												tempUserName={attendee.name}
												viewerIsEventAdmin={isCurrenUserEventAdmin}
												attendanceId={attendee.id}
												numGuests={attendee.guest_count}
											/>
										</div>
									{/each}
								</div>
							{/if}
						</div>
						<div class="mb-3 mt-5">
							{#if allAttendeesMaybeGoing.length > 0}
								<h2 class="my-3 flex w-full justify-center font-semibold">
									{numAttendeesMaybeGoing} maybe{numAttendeesMaybeGoing == 1 ? '' : 's'}
								</h2>
								<div class="mx-5 flex flex-wrap -space-x-4 text-black">
									{#each allAttendeesMaybeGoing as attendee (attendee.id)}
										<div animate:flip out:fade={{ duration: 300 }}>
											<ProfileAvatar
												userId={attendee.user_id}
												tempUserName={attendee.name}
												viewerIsEventAdmin={isCurrenUserEventAdmin}
												attendanceId={attendee.id}
												numGuests={attendee.guest_count}
											/>
										</div>
									{/each}
								</div>
							{/if}
						</div>
						<div class="mb-3 mt-5">
							{#if allAttendeesNotGoing.length > 0}
								<h2 class="my-3 flex w-full justify-center font-semibold">
									{numAttendeesNotGoing} not going
								</h2>
								<div class="mx-5 flex flex-wrap -space-x-4 text-black">
									{#each allAttendeesNotGoing as attendee (attendee.id)}
										<div animate:flip out:fade={{ duration: 300 }}>
											<ProfileAvatar
												userId={attendee.user_id}
												tempUserName={attendee.name}
												viewerIsEventAdmin={isCurrenUserEventAdmin}
												attendanceId={attendee.id}
												numGuests={attendee.guest_count}
											/>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</Dialog.Description>
				</Dialog.Header>
			</ScrollArea>
		{/if}
	</Dialog.Content>
</Dialog.Root>
