<script lang="ts">
	let { allAttendeesGoing, allAttendeesMaybeGoing, allAttendeesNotGoing } = $props();

	// Sum up the total number of attendees, including guests
	const totalGoing = allAttendeesGoing.length + allAttendeesGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0);
	const totalMaybe = allAttendeesMaybeGoing.length + allAttendeesMaybeGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0);
	const totalNotGoing = allAttendeesNotGoing.length + allAttendeesNotGoing.reduce((sum, a) => sum + (a.guest_count || 0), 0);
</script>

<div class="mb-3 flex w-full justify-center">
	<div
		class="flex w-fit justify-center rounded bg-slate-100 p-1 px-2 text-black opacity-70 dark:bg-slate-800 dark:text-white"
	>
		{totalGoing} going
		{#if totalMaybe > 0}
			, {totalMaybe} maybe{totalMaybe > 1 ? 's' : ''}
		{/if}
		{#if totalNotGoing > 0}
			, {totalNotGoing} not going
		{/if}
	</div>
</div>
