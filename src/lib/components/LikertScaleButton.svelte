<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		question = null,
		scale = 6,
		value = $bindable<number>(3),
		min = 'Not at all',
		max = 'Very'
	} = $props();

	const handleClick = (selectedValue: number) => {
		value = selectedValue;
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
				class={`rounded px-3 py-2 sm:px-4 ${value === num ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-black hover:bg-blue-400'}`}
			>
				{num}
			</Button>
		{/each}
	</div>
	<div class="mb-4 flex w-full justify-between space-x-1 text-base max-w-[300px]">
		<div>{min}</div>
		<div></div>
		<div>{max}</div>
	</div>
</div>
