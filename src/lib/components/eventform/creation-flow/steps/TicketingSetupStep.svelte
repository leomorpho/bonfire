<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { FlowData } from '../flow-enums';
	import { ALLOWED_EVENT_CURRENCIES } from '$lib/enums';

	let { data }: { data: FlowData } = $props();

	let ticketCurrency = $state(data.ticketCurrency || 'usd');
	let maxTicketsPerUser = $state(data.maxTicketsPerUser || 5);
	let selectedCurrency = $state({ value: ticketCurrency, label: ticketCurrency.toUpperCase() });

	// Update the data when inputs change
	$effect(() => {
		data.ticketCurrency = ticketCurrency;
		data.maxTicketsPerUser = maxTicketsPerUser;
	});

	// Update ticketCurrency when selection changes
	$effect(() => {
		if (selectedCurrency) {
			ticketCurrency = selectedCurrency.value;
		}
	});

	const currencyOptions = ALLOWED_EVENT_CURRENCIES.map(currency => ({
		value: currency,
		label: currency.toUpperCase()
	}));
</script>

<div class="space-y-6">
	<div>
		<Label for="ticket-currency" class="text-base font-medium">Currency</Label>
		<Select.Root bind:selected={selectedCurrency}>
			<Select.Trigger class="mt-2">
				<Select.Value placeholder="Select currency" />
			</Select.Trigger>
			<Select.Content>
				{#each currencyOptions as option}
					<Select.Item value={option.value}>{option.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<p class="text-sm text-gray-500 mt-1">
			Choose the currency for your event tickets
		</p>
	</div>

	<div>
		<Label for="max-tickets" class="text-base font-medium">Maximum tickets per person</Label>
		<Input
			id="max-tickets"
			type="number"
			bind:value={maxTicketsPerUser}
			min="1"
			max="20"
			class="mt-2"
		/>
		<p class="text-sm text-gray-500 mt-1">
			Limit how many tickets one person can purchase
		</p>
	</div>

	<div class="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
		<h4 class="font-medium text-amber-800 dark:text-amber-200 mb-2">Next steps</h4>
		<p class="text-sm text-amber-700 dark:text-amber-300">
			After creating your event, you'll be able to add specific ticket types with names, descriptions, prices, and quantities.
		</p>
	</div>
</div>