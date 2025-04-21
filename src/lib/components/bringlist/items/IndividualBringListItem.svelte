<script lang="ts">
	import { BringListCountTypes } from '$lib/enums';
	import { Tally5, UserRound } from 'lucide-svelte';

	let { itemName, itemUnit, numBrought } = $props();
</script>

<div
	class={`my-2 flex w-full items-center justify-between rounded-xl bg-slate-200 p-3 text-base text-black outline-none ring-0 focus:outline-none focus-visible:ring-0 dark:bg-slate-800 dark:text-white`}
>
	<div class="flex items-center">
		{itemName}
	</div>
	<div class="flex items-center">
		{#if itemUnit == BringListCountTypes.PER_PERSON}
			<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
		{:else if itemUnit == BringListCountTypes.COUNT}
			<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
		{/if}
		<span>{numBrought}</span>
	</div>
</div>
