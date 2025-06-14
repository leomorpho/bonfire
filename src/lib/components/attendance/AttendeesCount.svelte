<script lang="ts">
	let {
		numAttendeesGoing,
		numAttendeesMaybeGoing,
		numAttendeesNotGoing,
		numAttendeesInvited = 0
	} = $props();
</script>

<div class="flex w-full justify-center items-center">
	<div
		class="flex w-fit justify-center items-center rounded-lg bg-slate-200 p-1 px-2 text-black opacity-70 dark:bg-slate-800 dark:text-white"
	>
		{numAttendeesGoing} going
		{#if numAttendeesMaybeGoing > 0}
			, {numAttendeesMaybeGoing} maybe{numAttendeesMaybeGoing > 1 ? 's' : ''}
		{/if}
		{#if numAttendeesInvited > 0}
			, {numAttendeesInvited} invited
		{/if}
		{#if numAttendeesNotGoing > 0 && numAttendeesNotGoing < 20}
			, {numAttendeesNotGoing} not going
		{/if}
	</div>
</div>
