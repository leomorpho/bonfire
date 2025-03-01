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
			class="my-6 flex items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
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
					class="border-0 bg-slate-200 bg-opacity-90 dark:bg-slate-800 dark:bg-opacity-90 dark:text-white "
				>
					<Card.Header>
						<Card.Title class="my-3 flex w-full justify-center font-normal"
							>Bought {tx.num_log_tokens} logs

							{#if tx.total_money_amount && tx.currency}
								for {formatMoneyAmount(tx.total_money_amount, tx.currency)}
							{/if}
						</Card.Title>
						<Card.Description
							class="mt-2 flex w-full flex-col items-center justify-between space-y-2 sm:flex-row"
						>
							<div>
								{formatHumanReadable(tx.created_at)}
							</div>
							<div class="w-min">
								<CopyTextField value={tx.stripe_payment_intent} />
							</div>
						</Card.Description>
					</Card.Header>
					<Card.Footer>
						<!-- <CopyTextField value={tx.stripe_payment_intent}/> -->
						<!-- {#if currUserId == announcement.user_id || isCurrenUserEventAdmin}
							<a
								href={`/bonfire/${eventId}/announcement/${announcement.id}/update`}
								class="update-announcement"
								><Button class="mt-2 rounded-xl" variant="outline"
									><Pencil class="h-4 w-4" /></Button
								></a
							>
						{/if} -->
					</Card.Footer>
				</Card.Root>
			{/each}
		{/if}
	</div>
</div>
