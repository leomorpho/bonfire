<script lang="ts">
	let { allAttendeesGoing, allAttendeesMaybeGoing, allAttendeesNotGoing } = $props();
</script>

<div class="mb-3 flex w-full justify-center">
	<div
		class="flex w-fit justify-center rounded bg-slate-100 p-1 px-2 text-black opacity-70 dark:bg-slate-800 dark:text-white"
	>
		{allAttendeesGoing.length} going
		{#if allAttendeesMaybeGoing.length > 0}
			, {allAttendeesMaybeGoing.length} maybe{allAttendeesMaybeGoing.length > 1 ? 's' : ''}
		{/if}
		{#if allAttendeesNotGoing.length > 0}
			, {allAttendeesNotGoing.length} not going
		{/if}
	</div>
</div>
