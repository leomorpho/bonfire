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
	import NonProfitCard from '$lib/components/nonprofits/NonProfitCard.svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import BetaDevAlert from '$lib/components/BetaDevAlert.svelte';

	let numLogs = $state();
	let loadingNumLogs = $state(true);
	let nonProfit = $state();
	let client: TriplitClient;
	let loadingUserTriplitObject = $state(true);
	let favouriteNonProfitId = $state<string | null>(null);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromUserLogsQuery = client.subscribe(
			client.query('user_log_tokens').Where(['user_id', '=', $page.data.user.id]),
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

		// Fetch user's favorite non-profit
		const unsubscribeUser = client.subscribe(
			client.query('user').Include('favourite_non_profit').Where(['id', '=', $page.data.user.id]),
			(result) => {
				nonProfit = result[0]?.favourite_non_profit || null;
				console.log('--> result.nonProfit', nonProfit);

				loadingUserTriplitObject = false;
			},
			(error) => {
				console.error('Error fetching user data:', error);
			}
		);

		return () => {
			unsubscribeFromUserLogsQuery();
			unsubscribeUser();
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
	<BetaDevAlert localstorageKey={'dismissed-beta-dev-alert-buy-logs'} />

	<div class="my-2 mt-5 whitespace-normal break-words text-center">
		You have
		<span class="font-bold">
			{#if loadingNumLogs}
				<LoadingSpinner cls="w-4 h-4 mx-1" />
			{:else}
				{numLogs}
			{/if}
		</span> logs remaining. Click below to buy more.
	</div>

	<div class="flex w-full flex-col items-center justify-center md:flex-row md:space-x-10">
		<div>
			{#if loadingUserTriplitObject}
				<div class="flex w-full justify-center"><SvgLoader /></div>
			{:else if !nonProfit}
				<SelectNonProfitAlert />
			{:else}
				<div class="flex w-full justify-center">
					<NonProfitCard
						photoURL={nonProfit.photo_url}
						name={nonProfit.name}
						description={nonProfit.description}
						websiteURL={nonProfit.website_url}
						effectiveStartDate={nonProfit.effective_start_date}
						effectivEndDate={nonProfit.effective_end_date}
						showChangeSelectedNonProfitBtn={true}
					/>
				</div>
			{/if}
		</div>

		<div class="flex justify-center">
			<div class="my-5 w-60 space-y-5">
				<LogPackage
					disabled={!nonProfit}
					price={'1'}
					price_id={publicEnv.PUBLIC_1_LOG_PRICE_ID}
					num_logs="1"
				/>
				<LogPackage
					disabled={!nonProfit}
					price={'2'}
					price_id={publicEnv.PUBLIC_3_LOG_PRICE_ID}
					num_logs="3"
				/>
				<LogPackage
					disabled={!nonProfit}
					price={'5'}
					price_id={publicEnv.PUBLIC_10_LOG_PRICE_ID}
					num_logs="10"
				/>
			</div>
		</div>
	</div>
</CenteredPage>
