<script lang="ts">
	import { page } from '$app/stores';
	import BackButton from '$lib/components/BackButton.svelte';
	import LogPackage from '$lib/components/profile/LogPackage.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import CenteredPage from '$lib/components/CenteredPage.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import SelectNonProfitAlert from '$lib/components/payments/SelectNonProfitAlert.svelte';

	let numLogs = $state();
	let loadingNumLogs = $state(true);
	let nonProfits = $state([]);
	let client: TriplitClient;
	let favouriteNonProfitId = $state<string | null>(null);
	let loadingFavouriteNonProfit = $state(true);

	let canBuyLogs = $derived(!loadingFavouriteNonProfit && favouriteNonProfitId);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client.query('user_log_tokens').where(['user_id', '=', $page.data.user.id]).build(),
			(results) => {
				loadingNumLogs = false;
				numLogs = results[0].num_logs;
			},
			(error) => {
				console.error('Error fetching current temporary attendee:', error);
				loadingNumLogs = false;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		// Fetch non-profits
		const unsubscribeNonProfits = client.subscribe(
			client
				.query('non_profits')
				.where(['id', '=', favouriteNonProfitId])
				.order('created_at', 'DESC')
				.build(),
			(results) => {
				nonProfits = results;
				loadingFavouriteNonProfit = false;
			},
			(error) => {
				console.error('Error fetching non-profits:', error);
				loadingFavouriteNonProfit = false;
			}
		);

		// Fetch user's favorite non-profit
		const unsubscribeUser = client.subscribe(
			client.query('user').where(['id', '=', $page.data.user.id]).build(),
			(result) => {
				favouriteNonProfitId = result[0]?.favourite_non_profit_id || null;
			},
			(error) => {
				console.error('Error fetching user data:', error);
			}
		);

		return () => {
			unsubscribeFromUserLogsQuery();
			unsubscribeUser();
			unsubscribeNonProfits();
		};
	});
</script>

<CenteredPage>
	<div
		class="my-6 flex items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
	>
		<BackButton url="/profile" />
		<h2>Buy more logs</h2>
		<span></span>
	</div>

	<div class="my-2 mt-5 flex justify-center">
		You have
		<span class="mx-1 font-bold">
			{#if loadingNumLogs}
				<LoadingSpinner cls="w-4 h-4 mx-1" />
			{:else}
				{numLogs}
			{/if}
		</span> logs remaining. Click below to buy more.
	</div>

	{#if !canBuyLogs}
		<SelectNonProfitAlert />
	{:else}
		<div class="w-full justify-center">Thanks for supporting...</div>
	{/if}

	<div class="my-5 space-y-5">
		<LogPackage
			disabled={!canBuyLogs}
			price={'1'}
			price_id={publicEnv.PUBLIC_1_LOG_PRICE_ID}
			num_logs="1"
		/>
		<LogPackage
			disabled={!canBuyLogs}
			price={'2'}
			price_id={publicEnv.PUBLIC_3_LOG_PRICE_ID}
			num_logs="3"
		/>
		<LogPackage
			disabled={!canBuyLogs}
			price={'5'}
			price_id={publicEnv.PUBLIC_10_LOG_PRICE_ID}
			num_logs="10"
		/>
	</div>
</CenteredPage>
