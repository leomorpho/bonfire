<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import Checkbox from '../../ui/checkbox/checkbox.svelte';
	import Input from '../../ui/input/input.svelte';
	import { slide } from 'svelte/transition';
	import { Ticket } from 'lucide-svelte';

	let { 
		oninput, 
		isTicketed = $bindable(false),
		maxTicketsPerUser = $bindable(5),
		currency = $bindable('usd'),
		disabled = false
	} = $props();

	let checked = $state(isTicketed);

	$effect(() => {
		if (checked !== isTicketed) {
			isTicketed = checked;
		}
	});

	$effect(() => {
		if (!checked) {
			isTicketed = false;
		}
	});
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<!-- Checkbox + Label -->
	<div class="flex items-center space-x-2">
		<Checkbox id="enable-ticketing" bind:checked {disabled} />
		<Label
			for="enable-ticketing"
			class="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
		>
			<Ticket class="mx-1 h-5 w-5" /> Enable paid ticketing
		</Label>
	</div>
	
	{#if disabled}
		<p class="text-xs text-amber-600 dark:text-amber-400 mt-2">
			Save the event first before enabling ticketing
		</p>
	{/if}

	{#if checked}
		<!-- Description + Input -->`
		<div transition:slide={{ duration: 300 }} class="mt-4 flex flex-col items-center space-y-3">
			<p class="text-center text-sm text-gray-700 dark:text-gray-300">
				Enable ticketing to sell paid tickets for your event. Note: Guests are not allowed for ticketed events - attendees must purchase individual tickets.
			</p>
			
			<div class="flex flex-col items-center space-y-2">
				<Label for="maxTicketsPerUserInput" class="text-sm">
					Maximum tickets per person
				</Label>
				<Input
					id="maxTicketsPerUserInput"
					type="number"
					bind:value={maxTicketsPerUser}
					min="1"
					max="20"
					pattern="[0-9]*"
					inputmode="numeric"
					class="w-24 bg-slate-200 text-center dark:bg-slate-900 sm:w-20 md:w-24"
					{oninput}
				/>
			</div>

			<div class="text-xs text-gray-600 dark:text-gray-400 text-center space-y-1">
				<p>• You'll be able to create different ticket types with custom prices</p>
				<p>• Attendees cannot bring guests - they must buy multiple tickets instead</p>
				<p>• Payment processing is handled securely through Stripe</p>
			</div>
		</div>
	{/if}
</div>