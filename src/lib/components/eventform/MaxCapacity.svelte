<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import { onMount } from 'svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import Input from '../ui/input/input.svelte';

	let { oninput, value = $bindable<number | undefined | null>() } = $props();
	let checked = $state(value !== null && value !== undefined && value !== 0);
</script>

<div class="mt-4 rounded-lg bg-slate-100 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="capacity-toggle" bind:checked />
		<Label
			for="capacity-toggle"
			class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Limit event capacity
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input -->
		<div class="mt-4 flex flex-col items-center space-y-3">
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Attendance will be limited to a set number of confirmed attendees marked as going. New RSVPs
				for "going" will only be possible if someone changes their status to "not going".
			</p>
			<Input
				type="number"
				bind:value
				min="0"
				pattern="[0-9]*"
				inputmode="numeric"
				class="w-24 bg-slate-200 text-center dark:bg-slate-900 sm:w-20 md:w-24"
				{oninput}
			/>
		</div>
	{/if}
</div>
