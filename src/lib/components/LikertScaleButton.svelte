<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Check } from 'lucide-svelte';

	let {
		question = null,
		scale = 5,
		value = $bindable<number>(50), // Default value set to 50
		min = 'Not at all',
		max = 'Very',
		minColor = '#3b82f6', // Default blue
		maxColor = '#f97316' // Default orange
	} = $props();

	let normalizedValue = $derived(Math.round((value / 100) * (scale - 1)) + 1);

	// Function to interpolate between two colors
	function interpolateColor(color1: string, color2: string, factor: number): string {
		if (factor <= 0) return color1;
		if (factor >= 1) return color2;

		const r1 = parseInt(color1.substring(1, 3), 16);
		const g1 = parseInt(color1.substring(3, 5), 16);
		const b1 = parseInt(color1.substring(5, 7), 16);

		const r2 = parseInt(color2.substring(1, 3), 16);
		const g2 = parseInt(color2.substring(3, 5), 16);
		const b2 = parseInt(color2.substring(5, 7), 16);

		const r = Math.round(r1 + (r2 - r1) * factor);
		const g = Math.round(g1 + (g2 - g1) * factor);
		const b = Math.round(b1 + (b2 - b1) * factor);

		return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
	}

	const handleClick = (selectedValue: number) => {
		// Convert the selected scale value back to the 0-100 range
		value = Math.round(((selectedValue - 1) / (scale - 1)) * 100);
	};

	// Event handler functions for mouseover and mouseout
	const handleMouseOver = (event: MouseEvent) => {
		(event.currentTarget as HTMLElement).style.filter = 'brightness(1.1)';
	};

	const handleMouseOut = (event: MouseEvent) => {
		(event.currentTarget as HTMLElement).style.filter = 'brightness(1)';
	};
</script>

<div class="flex flex-col items-center">
	{#if question}
		<h2 class="mb-4 text-center text-xl font-bold">{question}</h2>
	{/if}
	<div class="mb-4 flex w-fit justify-between space-x-1">
		{#each Array.from({ length: scale }, (_, i) => i + 1) as num}
			<Button
				onclick={() => handleClick(num)}
				class={`h-8 w-8 rounded-lg text-xs transition duration-300 ease-in-out sm:h-10 sm:w-10 sm:text-sm md:text-base ${ normalizedValue == num?'ring-2 ring-white':''}`}
				style={`background-color: ${interpolateColor(minColor, maxColor, (num - 1) / (scale - 1))}; color: white;`}
				onmouseover={handleMouseOver}
				onmouseout={handleMouseOut}
			>
				{#if normalizedValue == num}
					<Check />
				{:else}
					{num}
				{/if}
			</Button>
		{/each}
	</div>
	<div class="mb-4 flex w-full max-w-[300px] justify-between space-x-1 text-base">
		<div>{min}</div>
		<div></div>
		<div>{max}</div>
	</div>
</div>
