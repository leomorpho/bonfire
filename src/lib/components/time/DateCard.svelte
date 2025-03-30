<script lang="ts">
	import { onMount } from 'svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { formatHumanReadable } from '$lib/utils';

	// Access the date prop using $props
	let { date } = $props();

	// Function to format the date and return month and day separately
	function formatDate(dateObj: Date): { month: string; day: string } {
		const month = dateObj.toLocaleString('default', { month: 'short' });
		const day = dateObj.toLocaleString('default', { day: 'numeric' });
		return { month, day };
	}

	// Initialize formattedMonth and formattedDay with empty strings
	let formattedMonth = $state('');
	let formattedDay = $state('');

	onMount(() => {
		const { month, day } = formatDate(new Date(date));
		formattedMonth = month;
		formattedDay = day;
	});
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		<div
			class="flex flex-col items-center justify-center rounded-lg bg-slate-100 p-1 px-3 text-slate-400 shadow-sm dark:bg-slate-700 dark:text-slate-200"
		>
			<span class="text-xs font-semibold">{formattedMonth}</span>
			<span class="text-sm font-bold">{formattedDay}</span>
		</div>
	</HoverCard.Trigger>
	<HoverCard.Content>{formatHumanReadable(date)}</HoverCard.Content>
</HoverCard.Root>
