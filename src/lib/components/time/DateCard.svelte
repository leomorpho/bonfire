<script lang="ts">
	import { onMount } from 'svelte';
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';
	import { formatHumanReadable } from '$lib/utils';

	// Access the date prop using $props
	let { date } = $props();

	// Function to format the date and return month, day, and time separately
	function formatDate(dateObj: Date): { month: string; day: string; time: string } {
		const month = dateObj.toLocaleString('default', { month: 'short' });
		const day = dateObj.toLocaleString('default', { day: 'numeric' });
		const time = dateObj.toLocaleString('default', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
		return { month, day, time };
	}

	// Initialize formattedMonth, formattedDay, and formattedTime with empty strings
	let formattedMonth = $state('');
	let formattedDay = $state('');
	let formattedTime = $state('');

	onMount(() => {
		const { month, day, time } = formatDate(new Date(date));
		formattedMonth = month;
		formattedDay = day;
		formattedTime = time;
	});
</script>

<HoverCard.Root>
	<HoverCard.Trigger>
		<div
			class="text--400 flex w-20 flex-col items-center justify-center rounded-lg bg-slate-300 p-1 px-3 shadow-sm dark:bg-slate-700 dark:text-slate-200"
		>
			<span class="text-xs font-normal">{formattedTime}</span>
			<span class="text-sm font-semibold">{formattedMonth} {formattedDay}</span>
		</div>
	</HoverCard.Trigger>
	<HoverCard.Content>
		<div class="flex flex-col items-center">
			<span class="text-sm">{formatHumanReadable(date)}</span>
		</div>
	</HoverCard.Content>
</HoverCard.Root>
