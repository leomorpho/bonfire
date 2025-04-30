<script lang="ts">
	let { numAttendeesGoing, numAttendeesMaybeGoing, numAttendeesNotGoing } = $props();

</script>

<div class="mb-3 flex w-full justify-center">
	<div
		class="flex w-fit justify-center rounded bg-slate-200 p-1 px-2 text-black opacity-70 dark:bg-slate-800 dark:text-white"
	>
		{numAttendeesGoing} going
		{#if numAttendeesMaybeGoing > 0}
			, {numAttendeesMaybeGoing} maybe{numAttendeesMaybeGoing > 1 ? 's' : ''}
		{/if}
		{#if numAttendeesNotGoing > 0}
			, {numAttendeesNotGoing} not going
		{/if}
	</div>
</div>
