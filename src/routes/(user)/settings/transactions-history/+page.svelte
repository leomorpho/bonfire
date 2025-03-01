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
			<div class="flex w-full justify-center h-32"><SvgLoader /></div>
			
		{:else}
			{#each transactions as transaction}
				<Card.Root
					class="border-0 bg-slate-200 bg-opacity-90 dark:bg-slate-800 dark:bg-opacity-90 dark:text-white "
				>
					<Card.Header>
						<Card.Title class="flex font-normal w-full justify-center my-3"
							>Bought {transaction.num_log_tokens} logs</Card.Title
						>
						<Card.Description class="mt-2 w-full flex justify-between items-center flex-col sm:flex-row space-y-2">
							<div>
								{formatHumanReadable(transaction.created_at)}
							</div>
							<div class="w-min">
								<CopyTextField value={transaction.stripe_payment_intent} />
							</div>
						</Card.Description>
					</Card.Header>
					<Card.Footer>
						<!-- <CopyTextField value={transaction.stripe_payment_intent}/> -->
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
