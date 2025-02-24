<script lang="ts">
	import { BringListCountTypes } from '$lib/enums';
	import { Tally5, UserRound } from 'lucide-svelte';

	let { itemName, itemUnit, itemQuantityNeeded, userIdToNumBrought } = $props();

	let progressGradient = $state('');
	let progress = $state(0);
	let progressColor = $state('');

	// Calculate total brought from all assignments
	let totalBrought: number = $derived(
		Object.values(userIdToNumBrought).reduce((sum, num) => sum + num, 0) as number
	);

	$effect(() => {
		if (totalBrought) {
			// Compute progress percentage (0 - 100)
			progress = Math.min(100, Math.round((totalBrought / itemQuantityNeeded) * 100));

			// 🎨 Regular HSL transition (Red → Yellow → Green)
			progressColor = `hsl(${120 * (progress / 100)}, 100%, 40%)`;

			if (progress === 0) {
				progressColor = `hsl(0, 100%, 30%)`; // Pure red
			}

			// Gradient fill for progress
			progressGradient = `linear-gradient(to right, ${progressColor} ${progress}%, transparent ${progress}%)`;
		} else if (totalBrought == 0) {
			progressGradient = '';
		}
	});
</script>

<div
	style="background-image: {progressGradient};"
	class="flex h-8 w-full items-center justify-between rounded-xl bg-slate-200 p-3 text-black outline-none ring-0 focus:outline-none focus-visible:ring-0 dark:bg-slate-800 dark:text-white sm:h-10"
>
	<div>{itemName}</div>
	<div class="flex items-center">
		{#if itemUnit == BringListCountTypes.PER_PERSON}
			<UserRound class="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
		{:else if itemUnit == BringListCountTypes.COUNT}
			<Tally5 class="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
		{/if}
		<span>{itemQuantityNeeded}</span>
	</div>
</div>
