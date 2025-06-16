<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import type { FlowData } from '../flow-enums';
	import { CreditCard, Gift } from 'lucide-svelte';

	let { data }: { data: FlowData } = $props();

	let isPaid = $state(data.isPaid);

	// Update the data when selection changes
	$effect(() => {
		data.isPaid = isPaid;
	});

	function selectOption(paid: boolean) {
		isPaid = paid;
	}
</script>

<div class="space-y-4">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<!-- Free Event Option -->
		<Card
			class="cursor-pointer p-6 transition-all duration-200 {isPaid === false
				? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950'
				: 'hover:shadow-md'}"
			role="button"
			tabindex="0"
			onclick={() => selectOption(false)}
			onkeydown={(e) => e.key === 'Enter' && selectOption(false)}
		>
			<div class="flex flex-col items-center space-y-3 text-center">
				<div class="rounded-full bg-green-100 p-3 dark:bg-green-900">
					<Gift class="h-6 w-6 text-green-600 dark:text-green-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Free Event</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						No tickets required, anyone can attend
					</p>
				</div>
				{#if isPaid === false}
					<div class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
						<div class="h-2 w-2 rounded-full bg-white"></div>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Paid Event Option -->
		<Card
			class="cursor-pointer p-6 transition-all duration-200 {isPaid === true
				? 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950'
				: 'hover:shadow-md'}"
			role="button"
			tabindex="0"
			onclick={() => selectOption(true)}
			onkeydown={(e) => e.key === 'Enter' && selectOption(true)}
		>
			<div class="flex flex-col items-center space-y-3 text-center">
				<div class="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
					<CreditCard class="h-6 w-6 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Paid Event</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Sell tickets and manage capacity</p>
				</div>
				{#if isPaid === true}
					<div class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
						<div class="h-2 w-2 rounded-full bg-white"></div>
					</div>
				{/if}
			</div>
		</Card>
	</div>

	{#if isPaid === true}
		<div class="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
			<p class="text-sm text-blue-800 dark:text-blue-200">
				✨ You'll be able to set up ticket types and pricing in the next step
			</p>
		</div>
	{/if}
</div>
