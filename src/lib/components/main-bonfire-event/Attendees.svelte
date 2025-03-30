<script lang="ts">
	import { flip } from 'svelte/animate';
	import AnonAttendeesView from '../attendance/AnonAttendeesView.svelte';
	import AttendeesCount from '../attendance/AttendeesCount.svelte';
	import NoAttendeesYet from '../attendance/NoAttendeesYet.svelte';
	import { Skeleton } from '../ui/skeleton';
	import { fade } from 'svelte/transition';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import AttendeesDialog from '../AttendeesDialog.svelte';

	let {
		rsvpStatus,
		attendeesLoading,
		allAttendeesGoing,
		allAttendeesMaybeGoing,
		allAttendeesNotGoing,
		allAttendeesLeft,
		allAttendeesRemoved,
		eventNumAttendeesGoing,
		showMaxNumPeople = 10,
		isCurrenUserEventAdmin = false
	} = $props();

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

	let totalLeft = $derived(allAttendeesLeft.length);
	let totalRemoved = $derived(allAttendeesRemoved.length);
</script>

<div class="mx-3 mt-5 items-center">
	{#if attendeesLoading}
		<div class="flex flex-wrap items-center -space-x-3">
			{#each Array(20).fill(null) as _, index}
				<Skeleton class="size-12 rounded-full" />
			{/each}
		</div>
	{:else if rsvpStatus}
		{#if allAttendeesGoing.length > 0}
			<AttendeesCount
				numAttendeesGoing={totalGoing}
				numAttendeesMaybeGoing={totalMaybe}
				numAttendeesNotGoing={totalNotGoing}
			/>

			<div id="going-attendees" class="flex flex-wrap items-center justify-center -space-x-4">
				{#each allAttendeesGoing.slice(0, showMaxNumPeople) as attendee (attendee.id)}
					<div animate:flip out:fade={{ duration: 300 }}>
						<ProfileAvatar
							userId={attendee.user_id}
							tempUserName={attendee.name}
							viewerIsEventAdmin={isCurrenUserEventAdmin}
							attendanceId={attendee.id}
							baseHeightPx={allAttendeesGoing.length < 10 ? 60 : 50}
							numGuests={attendee.guest_count}
						/>
					</div>
				{/each}
				<AttendeesDialog
					{allAttendeesGoing}
					{allAttendeesMaybeGoing}
					{allAttendeesNotGoing}
					{allAttendeesLeft}
					{allAttendeesRemoved}
					{showMaxNumPeople}
					{isCurrenUserEventAdmin}
					numAttendeesGoing={totalGoing}
					numAttendeesMaybeGoing={totalMaybe}
					numAttendeesNotGoing={totalNotGoing}
					numAttendeesLeft={totalLeft}
					numAttendeesRemoved={totalRemoved}
				/>
			</div>
		{:else if allAttendeesGoing.length == 0}
			<NoAttendeesYet />
		{/if}
	{:else}
		<AnonAttendeesView numAttendingGoing={eventNumAttendeesGoing} />
	{/if}
</div>
