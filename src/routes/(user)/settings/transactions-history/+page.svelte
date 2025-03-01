<script lang="ts">
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import type { LogTokenTransaction } from '$lib/types';
	import CopyTextField from '$lib/components/text/CopyTextField.svelte';

	let transactions: Array<LogTokenTransaction> | undefined | null = $state();
	let loading = $state(true);
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client.query('transactions').where(['user_id', '=', $page.data.user.id]).build(),
			(results) => {
				transactions = results;

				loading = false;
			},
			(error) => {
				console.error('Error fetching transacitons:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		return () => {
			unsubscribeFromUserLogsQuery();
		};
	});

	export function formatMoneyAmount(cents: number, currency: string): string {
		if (isNaN(cents)) throw new Error('Invalid amount');
		if (typeof currency !== 'string' || currency.trim() === '') throw new Error('Invalid currency');

		const amount = (cents / 100).toFixed(2); // Convert cents to dollars and ensure two decimal places
		return `${currency.trim().toUpperCase()} ${amount}`;
	}
</script>

<div class="flex w-full justify-center">
	<div class="mx-4 mt-4 flex w-full flex-col justify-center sm:w-[450px] md:w-[550px] lg:w-[650px]">
		<div
			class="my-6 flex items-center justify-between rounded-xl bg-slate-100 p-3 text-2xl font-semibold shadow-md dark:bg-slate-800 dark:text-white"
		>
			<BackButton />
			<h2>Transactions</h2>
			<span></span>
		</div>

		{#if loading}
			<div class="flex h-32 w-full justify-center"><SvgLoader /></div>
		{:else}
			{#each transactions as tx}
				<Card.Root
					class="rounded-xl border border-slate-300 bg-white p-4 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				>
					<Card.Header class="flex flex-col items-center">
						<!-- Date at the top -->
						<div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
							{formatHumanReadable(tx.created_at)}
						</div>

						<Card.Title class="my-3 flex flex-col items-center text-center text-lg font-semibold">
							Bought {tx.num_log_tokens} logs
							{#if tx.total_money_amount && tx.currency}
								<span class="text-sm font-normal text-gray-600 dark:text-gray-300">
									for {formatMoneyAmount(tx.total_money_amount, tx.currency)}
								</span>
							{/if}
						</Card.Title>
					</Card.Header>

					<Card.Footer class="mt-3 w-full flex justify-center text-center text-xs text-gray-400 dark:text-gray-500">
						<span class="mr-2">Transaction ID:</span> <CopyTextField value={tx.stripe_payment_intent} />
					</Card.Footer>
				</Card.Root>
			{/each}
		{/if}
	</div>
</div>
