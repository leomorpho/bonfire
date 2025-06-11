<script lang="ts">
	import { dev } from '$app/environment';
	import { ABS_MAX_GUEST_NUM } from '$lib/enums';
	import { cn } from '$lib/utils';

	let { numGuests = $bindable<number>(), maxGuests = 6 } = $props();

	if (maxGuests > ABS_MAX_GUEST_NUM) {
		maxGuests = ABS_MAX_GUEST_NUM;
	}
	// Generate options dynamically based on maxGuests
	const OPTIONS = ['Just me', ...Array.from({ length: maxGuests }, (_, i) => `+${i + 1}`)];

	// Create valueMap dynamically from OPTIONS (set "Just me" to 0)
	const valueMap = Object.fromEntries(OPTIONS.map((option, index) => [option, index]));

	let selected = $state(OPTIONS[0]);

	const handleSelect = (option: string) => {
		selected = option;
		numGuests = valueMap[option];
		if (dev) {
			console.log('numGuests', numGuests);
		}
	};

	// Sync selected value with numGuests
	$effect(() => {
		if (numGuests !== undefined && numGuests >= 0 && numGuests <= maxGuests) {
			selected = OPTIONS[numGuests];
		}
	});
</script>

<div class="flex w-full justify-center">
	<div class="flex rounded-xl bg-slate-200 dark:bg-slate-800">
		{#each OPTIONS as option, i}
			<button
				type="button"
				class={cn(
					'cursor-pointer p-2 text-sm transition-colors hover:bg-green-300 focus:outline-none dark:hover:bg-green-500',
					i === 0 && 'rounded-s-xl',
					i === OPTIONS.length - 1 && 'rounded-e-xl',
					selected === option ? 'bg-green-400 font-semibold dark:bg-green-600' : ''
				)}
				onclick={(e: Event) => {
					e.stopPropagation();
					handleSelect(option);
				}}
			>
				{option}
			</button>
		{/each}
	</div>
</div>
