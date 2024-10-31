<!-- SelectableBadge.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	export let value: string; // The value of the badge
	export let label: string; // The display name of the badge
	export let isSelected: boolean = false; // Determines if the badge is selected

	function toggleBadge() {
		isSelected = !isSelected;
	}
</script>

<Button
	class={`inline-flex items-center rounded-md px-4 py-2 transition-colors duration-150 ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
	variant="outline"
	on:click={toggleBadge}
>
	{label}
	{#if isSelected}
		<input type="checkbox" value={true} name={value} class="hidden" checked />
	{/if}
</Button>
