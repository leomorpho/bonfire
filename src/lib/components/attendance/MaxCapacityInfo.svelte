<script lang="ts">
	let { maxCapacity, rsvpEnabled } = $props();
</script>

<div
	class="mt-5 flex justify-center rounded-lg bg-slate-100 p-2 text-center text-sm opacity-70 dark:bg-slate-800 dark:opacity-70"
>
	{#if rsvpEnabled}
		This event is limited to {maxCapacity} attendees going, as set by the organizer.
	{:else}
		Sorry, this event has reached its maximum capacity of {maxCapacity} attendees, as set by the organizer.
		If a spot opens up due to a cancellation, it will become available for a new attendee.
	{/if}
</div>
