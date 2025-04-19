<script lang="ts">
	import { ABS_MAX_GUEST_NUM } from './../../enums.ts';
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '../ui/checkbox/checkbox.svelte';
	import Input from '../ui/input/input.svelte';
	import { slide } from 'svelte/transition';

	let { oninput, value = $bindable<number | undefined | null>() } = $props();
	let checked = $state(value !== null && value !== undefined && value !== 0);

	$effect(() => {
		if (!value && checked) {
			value = 0;
		}
	});

	$effect(() => {
		if (!checked) {
			value = 0;
		}
	});
</script>

<div class="mt-4 rounded-lg bg-slate-100 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="enbale-attendees-bringing-guests" bind:checked />
		<Label
			for="enbale-attendees-bringing-guests"
			class="flex w-full justify-start text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Let attendees bring guests
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input -->
		<div transition:slide={{ duration: 300 }} class="mt-4 flex flex-col items-center space-y-3">
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Enable this feature to let attendees include guests in their RSVP, providing an accurate
				headcount for informal events without tickets.
			</p>
			<Input
				id="maxNumberOfGuestsPerAttendeeInput"
				type="number"
				bind:value
				min="1"
				max={ABS_MAX_GUEST_NUM}
				pattern="[0-9]*"
				inputmode="numeric"
				class="w-24 bg-slate-200 text-center dark:bg-slate-900 sm:w-20 md:w-24"
				{oninput}
			/>
		</div>
	{/if}
</div>
