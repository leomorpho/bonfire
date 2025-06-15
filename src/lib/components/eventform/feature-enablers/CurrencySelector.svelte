<script lang="ts">
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getCurrency } from '$lib/currencies';
	import { ALLOWED_EVENT_CURRENCIES } from '$lib/enums';
	import { DollarSign } from 'lucide-svelte';

	let { currency = $bindable('usd'), oninput, disabled = false } = $props();

	// Group currencies by region for better UX
	const currencyGroups = [
		{
			label: 'Popular',
			currencies: ['usd', 'eur', 'gbp', 'cad', 'aud', 'jpy']
		},
		{
			label: 'Americas',
			currencies: ['mxn', 'brl']
		},
		{
			label: 'Europe',
			currencies: ['chf', 'sek', 'dkk', 'nok']
		},
		{
			label: 'Asia Pacific',
			currencies: ['cny', 'hkd', 'sgd', 'inr', 'krw', 'nzd']
		},
		{
			label: 'Middle East & Africa',
			currencies: ['aed', 'zar']
		}
	];

	function getGroupedCurrencies() {
		// Filter groups to only include allowed currencies
		return currencyGroups
			.map((group) => ({
				...group,
				currencies: group.currencies
					.filter((code) => ALLOWED_EVENT_CURRENCIES.includes(code))
					.map((code) => getCurrency(code))
					.filter(Boolean)
			}))
			.filter((group) => group.currencies.length > 0);
	}

	const groupedCurrencies = getGroupedCurrencies();
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

		<Select.Root bind:selected={currency} onSelectedChange={() => oninput?.()} {disabled}>
			<Select.Trigger id="currency-select" class="w-full" {disabled}>
				<Select.Value placeholder="Select a currency" />
			</Select.Trigger>
			<Select.Content>
				{#each groupedCurrencies as group}
					<Select.Group>
						<Select.Label>{group.label}</Select.Label>
						{#each group.currencies as curr}
							<Select.Item value={curr.code}>
								<div class="flex w-full items-center justify-between">
									<span>{curr.symbol} {curr.name}</span>
									<span class="ml-2 text-xs text-muted-foreground">
										{curr.code.toUpperCase()}
									</span>
								</div>
							</Select.Item>
						{/each}
					</Select.Group>
				{/each}
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
