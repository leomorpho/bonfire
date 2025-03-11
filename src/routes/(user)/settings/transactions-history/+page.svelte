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
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { TransactionType } from '$lib/enums';

	let transactions: Array<LogTokenTransaction> | undefined | null = $state();
	let loading = $state(true);
	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client
				.query('transactions')
				.Where(['user_id', '=', $page.data.user.id])
				.order('created_at', 'DESC')
				,
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
	<div
		class="mx-4 mt-4 flex w-full flex-col justify-center px-1 sm:w-[450px] md:w-[550px] lg:w-[650px]"
	>
		<div
			class="my-6 flex items-center justify-between rounded-xl bg-slate-100 p-3 text-2xl font-semibold shadow-md dark:bg-slate-800 dark:text-white"
		>
			<BackButton url={'/profile'}/>
			<h2>Transactions</h2>
			<span></span>
		</div>

		{#if loading}
			<div class="flex h-32 w-full justify-center"><SvgLoader /></div>
		{:else}
			{#if transactions.length == 0}
				<div class="mt-10 flex justify-center">
					<div class="w-fit"><BonfireNoInfoCard text="No transactions yet" /></div>
				</div>
			{/if}
			{#each transactions as tx}
				<Card.Root
					class="my-2 rounded-xl border border-slate-300 bg-white p-1 shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white"
				>
					<Card.Header class="flex flex-col items-center">
						<!-- Date at the top -->
						<div class="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
							{formatHumanReadable(tx.created_at)}
						</div>

						<Card.Title class="my-3 flex flex-col items-center text-center text-lg font-semibold">
							{#if tx.transaction_type == TransactionType.PURCHASE}
								Bought {tx.num_log_tokens} logs
								{#if tx.total_money_amount && tx.currency}
									<span class="text-sm font-normal text-gray-600 dark:text-gray-300">
										for {formatMoneyAmount(tx.total_money_amount, tx.currency)}
									</span>
								{/if}
							{:else if tx.transaction_type == TransactionType.BONFIRE_HOSTED}
								Spent {tx.num_log_tokens} log{tx.num_log_tokens > 1 ? 's' : ''} on
								<a
									class="mx-1 font-medium text-blue-600 underline transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
									href={`/bonfire/${tx.event_id}`}
								>
									1 bonfire
								</a>
							{:else if tx.transaction_type == TransactionType.REFUND}
								Got reimbursed for {tx.num_log_tokens} log{tx.num_log_tokens > 1 ? 's' : ''}
							{/if}
						</Card.Title>
					</Card.Header>

					<Card.Footer
						class="mt-3 flex w-full flex-col justify-center space-y-1 text-center text-xs text-gray-400 dark:text-gray-500 sm:flex-row sm:space-y-0"
					>
						{#if tx.stripe_payment_intent}
							<span class="mr-2">Transaction ID:</span>
							<CopyTextField value={tx.stripe_payment_intent} />
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}
		{/if}
	</div>
</div>
