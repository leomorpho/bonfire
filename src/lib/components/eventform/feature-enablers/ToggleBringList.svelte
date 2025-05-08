<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '../../ui/checkbox/checkbox.svelte';
	import { slide } from 'svelte/transition';

	let { oninput, checked = $bindable<boolean>(false) } = $props();
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="prevent-free-loaders" bind:checked onclick={oninput} />
		<Label
			for="prevent-free-loaders"
			class="flex w-full justify-start text-sm font-medium  leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			Enable bring list
		</Label>
	</div>

	{#if checked}
		<!-- Description + Input with Svelte Slide Transition -->
		<div
			transition:slide={{ duration: 300 }}
			class="mt-4 flex flex-col items-center space-y-3 overflow-hidden"
		>
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Use the Bring List to organize potluck contributions. People can sign up for items, so you
				know who's bringing what.
			</p>
		</div>
	{/if}
</div>
