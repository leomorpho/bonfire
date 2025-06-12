<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let { numAttendingGoing, numAttendeesInvited = 0 } = $props();
</script>

<div class="flex w-full justify-center">
	<div
		class="flex w-fit items-center justify-center rounded-lg bg-purple-500 bg-opacity-75 p-2 px-4 text-sm text-white ring-glow md:px-8"
	>
		<Avatar.Root
			class="mr-2 h-12 w-12 border-2 border-white bg-white dark:bg-slate-900 sm:h-14 sm:w-14"
		>
			<Avatar.Image src={'/icon-128.png'} alt={''} />
			<Avatar.Fallback>{'BO'}</Avatar.Fallback>
		</Avatar.Root>
		{numAttendingGoing} going{numAttendeesInvited > 0 ? `, ${numAttendeesInvited} invited` : ''}
	</div>
</div>
