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

	// TODO: this is awkward. There are a lot of render calls triggered from BringItemProgressBar.
	// $effect(() => {
	// 	console.log('totalBrought', totalBrought);
	// });

	$effect(() => {
		if (totalBrought > 0.5) {
			// Compute progress percentage (0 - 100)
			progress = Math.min(100, Math.round((totalBrought / itemQuantityNeeded) * 100));

			// Dynamically adjust the lightness (higher progress → darker color)
			const lightness = 55 - (progress / 100) * 30; // Maps 0% → 50%, 100% → 30%

			// 🎨 Regular HSL transition (Red → Yellow → Green)
			progressColor = `hsl(${120 * (progress / 100)}, 100%, ${lightness}%)`;

			if (progress === 0) {
				progressColor = `hsl(0, 100%, 50%)`; // Pure red with 50% lightness at 0%
			}

			// Gradient fill for progress
			progressGradient = `linear-gradient(to right, ${progressColor} ${progress}%, transparent ${progress}%)`;
		} else {
			progressGradient = '';
		}
	});
</script>

<div
	style="background-image: {progressGradient};"
	class={`${progress == 0 ? 'animate-alert' : ''} flex h-8 w-full items-center justify-between rounded-xl bg-slate-200 p-3 text-black outline-none ring-0 focus:outline-none focus-visible:ring-0 dark:bg-slate-800 dark:text-white sm:h-10`}
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
		<span>{itemQuantityNeeded}</span>
	</div>
</div>

<style>
	@keyframes alertGlow {
		0% {
			background-position: 0% 50%;
			box-shadow: 0 0 10px rgba(199, 32, 32, 0.4);
			transform: scale(1);
		}
		50% {
			background-position: 100% 50%;
			box-shadow: 0 0 20px rgba(199, 32, 32, 0.8);
			transform: scale(1.03);
		}
		100% {
			background-position: 0% 50%;
			box-shadow: 0 0 10px rgba(199, 32, 32, 0.4);
			transform: scale(1);
		}
	}

	.animate-alert {
		background: linear-gradient(120deg, #7a7c7f, #c72020, #7a7c7f);
		background-size: 200% 200%;
		animation: alertGlow 2.5s infinite ease-in-out;
		border-radius: 12px;
		transition: all 0.3s ease-in-out;
	}
</style>
