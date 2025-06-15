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
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Free Event Option -->
		<Card class="p-6 cursor-pointer transition-all duration-200 {isPaid === false ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:shadow-md'}" 
			role="button" 
			tabindex="0"
			onclick={() => selectOption(false)}
			onkeydown={(e) => e.key === 'Enter' && selectOption(false)}>
			<div class="flex flex-col items-center text-center space-y-3">
				<div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
					<Gift class="h-6 w-6 text-green-600 dark:text-green-400" />
				</div>
				<div>
					<h3 class="font-semibold text-lg">Free Event</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						No tickets required, anyone can attend
					</p>
				</div>
				{#if isPaid === false}
					<div class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
						<div class="w-2 h-2 rounded-full bg-white"></div>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Paid Event Option -->
		<Card class="p-6 cursor-pointer transition-all duration-200 {isPaid === true ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:shadow-md'}" 
			role="button" 
			tabindex="0"
			onclick={() => selectOption(true)}
			onkeydown={(e) => e.key === 'Enter' && selectOption(true)}>
			<div class="flex flex-col items-center text-center space-y-3">
				<div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
					<CreditCard class="h-6 w-6 text-blue-600 dark:text-blue-400" />
				</div>
				<div>
					<h3 class="font-semibold text-lg">Paid Event</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Sell tickets and manage capacity
					</p>
				</div>
				{#if isPaid === true}
					<div class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
						<div class="w-2 h-2 rounded-full bg-white"></div>
					</div>
				{/if}
			</div>
		</Card>
	</div>

	{#if isPaid === true}
		<div class="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
			<p class="text-sm text-blue-800 dark:text-blue-200">
				✨ You'll be able to set up ticket types and pricing in the next step
			</p>
		</div>
	{/if}
</div>