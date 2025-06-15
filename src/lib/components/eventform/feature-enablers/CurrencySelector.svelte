<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getCurrency } from '$lib/currencies';
	import { ALLOWED_EVENT_CURRENCIES } from '$lib/enums';
	import { DollarSign } from 'lucide-svelte';

	let { currency = $bindable('usd'), oninput, disabled = false } = $props();

	// Ensure currency is a valid option, default to 'usd' if not set or invalid
	$effect(() => {
		if (!currency || !ALLOWED_EVENT_CURRENCIES.includes(currency)) {
			currency = 'usd';
		}
	});

	// Create flat array of all currencies with labels
	const allCurrencies = ALLOWED_EVENT_CURRENCIES.map((code) => {
		const curr = getCurrency(code);
		return {
			value: code,
			label: `${curr?.symbol} ${curr?.name} (${code.toUpperCase()})`
		};
	}).filter(Boolean);

	// Get display text for the trigger
	const triggerContent = $derived(() => {
		const selectedCurrency = allCurrencies.find((c) => c.value === currency);
		return selectedCurrency?.label ?? 'Select a currency';
	});

	// Handle value changes and trigger save
	function handleValueChange(newValue: string | undefined) {
		if (newValue && newValue !== currency) {
			currency = newValue;
			oninput?.();
		}
	}
</script>

<div class="mt-4 rounded-lg bg-slate-200 bg-opacity-70 p-4 dark:bg-slate-800 dark:bg-opacity-70">
	<div class="space-y-3">
		<div class="flex items-center gap-2">
			<DollarSign class="h-5 w-5" />
			<Label for="currency-select" class="text-sm font-medium">Event Currency</Label>
		</div>

		<p class="text-xs text-gray-600 dark:text-gray-400">
			{disabled
				? 'Currency is locked after tickets are created.'
				: 'Choose the currency for all ticket prices. This cannot be changed after tickets are created.'}
		</p>

		<Select.Root
			type="single"
			name="event-currency"
			bind:value={currency}
			onValueChange={handleValueChange}
			{disabled}
		>
			<Select.Trigger id="currency-select" class="w-full" {disabled}>
				{triggerContent()}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.Label>Available Currencies</Select.Label>
					{#each allCurrencies as curr (curr.value)}
						<Select.Item value={curr.value} label={curr.label}>
							{curr.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>

		{#if !disabled}
			<div class="text-xs text-gray-500 dark:text-gray-400">
				<p class="font-medium">Important Notes:</p>
				<ul class="mt-1 list-inside list-disc space-y-1">
					<li>This currency applies to all tickets for this event</li>
					<li>Cannot be changed after creating tickets</li>
					<li>Different currencies have different minimum amounts</li>
					<li>
						International customers can pay in their local currency (Stripe handles conversion)
					</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
