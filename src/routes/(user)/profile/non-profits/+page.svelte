<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { and, or, type TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { Check } from 'lucide-svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CenteredPage from '$lib/components/CenteredPage.svelte';
	import NonProfitCard from '$lib/components/nonprofits/NonProfitCard.svelte';

	let client: TriplitClient;
	let nonProfits = $state([]);
	let loading = $state(true);
	let favouriteNonProfitId = $state<string | null>(null);

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		// Fetch non-profits
		const unsubscribeNonProfits = client.subscribe(
			client
				.query('non_profits')
				.where(
					and([
						['effective_start_date', '<=', new Date().toISOString()], // Start date is in the past or today
						or([
							['effective_end_date', '>=', new Date().toISOString()], // End date is in the future
							['effective_end_date', '=', null] // OR no end date (still active)
						])
					])
				)
				.order('created_at', 'DESC')
				.build(),
			(results) => {
				nonProfits = results;
				loading = false;
			},
			(error) => {
				console.error('Error fetching non-profits:', error);
				loading = false;
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
			unsubscribeNonProfits();
			unsubscribeUser();
		};
	});

	// Toggle Favorite Non-Profit
	const toggleFavouriteNonProfit = async (nonProfitId: string) => {
		const isCurrentlyFavorite = favouriteNonProfitId === nonProfitId;
		if (isCurrentlyFavorite) return;
		const newFavoriteId = isCurrentlyFavorite ? null : nonProfitId;
		try {
			await client.update('user', $page.data.user.id, async (user) => {
				user.favourite_non_profit_id = newFavoriteId;
			});

			favouriteNonProfitId = newFavoriteId;
			toast.success(newFavoriteId ? 'Favorite non-profit saved!' : 'Favorite non-profit removed.');
		} catch (error) {
			console.error('Error updating favorite non-profit:', error);
			toast.error('Failed to update favorite.');
		}
	};
</script>

<CenteredPage>
	<div
		class="my-6 flex w-full items-center justify-between rounded-lg bg-slate-200 p-2 text-2xl font-semibold dark:bg-slate-800 dark:text-white"
	>
		<BackButton url='/profile'/>
		<h2 class="ml-1">Support a Cause</h2>
		<span></span>
	</div>

	{#if loading}
		<div class="mt-4 flex w-full justify-center"><p>Loading...</p></div>
	{:else if nonProfits.length === 0}
		<div class="mt-4 flex w-full justify-center"><p>No non-profits available.</p></div>
	{:else}
		<div class="mt-4 flex w-full justify-center">
			<div
				class="grid grid-cols-1 place-items-center gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3"
			>
				{#each nonProfits as nonProfit}
					<NonProfitCard
						selected={favouriteNonProfitId === nonProfit.id}
						photoURL={nonProfit.photo_url}
						name={nonProfit.name}
						description={nonProfit.description}
						websiteURL={nonProfit.website_url}
						effectiveStartDate={nonProfit.effective_start_date}
						effectivEndDate={nonProfit.effective_end_date}
						toggleFavouriteNonProfit={() => toggleFavouriteNonProfit(nonProfit.id)}
						selectable={true}
					/>
				{/each}
			</div>
		</div>
	{/if}
</CenteredPage>
