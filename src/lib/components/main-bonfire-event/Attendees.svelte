<script lang="ts">
	import { flip } from 'svelte/animate';
	import AnonAttendeesView from '../attendance/AnonAttendeesView.svelte';
	import AttendeesCount from '../attendance/AttendeesCount.svelte';
	import NoAttendeesYet from '../attendance/NoAttendeesYet.svelte';
	import { Skeleton } from '../ui/skeleton';
	import { fade } from 'svelte/transition';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import AttendeesDialog from '../AttendeesDialog.svelte';
	import InviteUsersModal from './InviteUsersModal.svelte';
	import { Button } from '../ui/button';
	import { UserPlus } from 'lucide-svelte';

	let {
		rsvpStatus,
		attendeesLoading,
		allAttendeesGoing,
		allAttendeesMaybeGoing,
		allAttendeesNotGoing,
		allAttendeesInvited,
		allAttendeesLeft,
		allAttendeesRemoved,
		eventNumAttendeesGoing,
		eventNumAttendeesInvited,
		showMaxNumPeople = 10,
		isCurrenUserEventAdmin = false,
		eventTitle = '',
		eventStartTime = '',
		eventEndTime = '',
		eventDescription = '',
		eventLocation = '',
		maxNumGuestsAllowedPerAttendee = 0,
		eventCreatorUserId = '',
		adminUserIds = new Set(),
		eventId = ''
	} = $props();

	let showInviteModal = $state(false);

	// Sum up the total number of attendees, including guests
	let totalGoing = $derived(
		allAttendeesGoing.length + allAttendeesGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0)
	);
	let totalMaybe = $derived(
		allAttendeesMaybeGoing.length +
			allAttendeesMaybeGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0)
	);
	let totalNotGoing = $derived(
		allAttendeesNotGoing.length +
			allAttendeesNotGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0)
	);
	let totalInvited = $derived(
		allAttendeesInvited.length +
			allAttendeesInvited.reduce((sum, a) => sum + (a.guest_count || 0), 0)
	);

	let totalLeft = $derived(allAttendeesLeft.length);
	let totalRemoved = $derived(allAttendeesRemoved.length);

	$effect(() => {
		console.log('totalGoing', totalGoing, 'totalMaybe', totalMaybe, 'totalNotGoing', totalNotGoing);
	});
</script>

<div class="mx-3 my-2 items-center text-base">
	{#if attendeesLoading}
		<div class="flex flex-wrap items-center -space-x-3">
			{#each Array(20).fill(null) as _, index}
				<Skeleton class="size-12 rounded-full" />
			{/each}
		</div>
	{:else if rsvpStatus}
		{#if allAttendeesGoing.length > 0}
			<div class="mb-4 flex items-center justify-between">
				<AttendeesCount
					numAttendeesGoing={totalGoing}
					numAttendeesMaybeGoing={totalMaybe}
					numAttendeesNotGoing={totalNotGoing}
					numAttendeesInvited={totalInvited}
				/>

				{#if isCurrenUserEventAdmin}
					<Button size="sm" variant="outline" onclick={() => (showInviteModal = true)} class="ml-2">
						<UserPlus class="mr-1 h-4 w-4" />
						Invite
					</Button>
				{/if}
			</div>

			<div
				id="going-attendees"
				class="flex flex-wrap items-center justify-center -space-x-4 space-y-2"
			>
				{#each allAttendeesGoing.slice(0, showMaxNumPeople) as attendee (attendee.id)}
					<div animate:flip out:fade={{ duration: 300 }}>
						<ProfileAvatar
							userId={attendee.user_id}
							tempUserName={attendee.name}
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							userIsEventAdmin={attendee.user_id === eventCreatorUserId ||
								adminUserIds.has(attendee.user_id)}
							attendanceId={attendee.id}
							baseHeightPx={allAttendeesGoing.length < 10 ? 60 : 50}
							numGuests={attendee.guest_count}
							userRsvpStatus={attendee.status}
							userGuestCount={attendee.guest_count || 0}
							maxGuestsAllowed={maxNumGuestsAllowedPerAttendee}
							{eventTitle}
							{eventStartTime}
							{eventEndTime}
							{eventDescription}
							{eventLocation}
						/>
					</div>
				{/each}
				<div class="pl-6">
					<AttendeesDialog
						{allAttendeesGoing}
						{allAttendeesMaybeGoing}
						{allAttendeesNotGoing}
						{allAttendeesInvited}
						{allAttendeesLeft}
						{allAttendeesRemoved}
						{showMaxNumPeople}
						{isCurrenUserEventAdmin}
						numAttendeesGoing={totalGoing}
						numAttendeesMaybeGoing={totalMaybe}
						numAttendeesNotGoing={totalNotGoing}
						numAttendeesInvited={totalInvited}
						numAttendeesLeft={totalLeft}
						numAttendeesRemoved={totalRemoved}
					/>
				</div>
			</div>
		{:else if allAttendeesGoing.length == 0}
			<NoAttendeesYet />
		{/if}
	{:else}
		<AnonAttendeesView
			numAttendingGoing={eventNumAttendeesGoing}
			numAttendeesInvited={eventNumAttendeesInvited}
		/>
	{/if}
</div>

<!-- Invite Users Modal -->
<InviteUsersModal isOpen={showInviteModal} {eventId} onClose={() => (showInviteModal = false)} />
