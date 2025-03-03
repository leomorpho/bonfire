<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { and, or, type TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { Check } from 'lucide-svelte';

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
		console.log('newFavoriteId--->', favouriteNonProfitId, nonProfitId);
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

<div class="flex flex-col items-center justify-center p-6">
	<h2 class="mb-4 text-center text-2xl font-bold">Select Your Favorite Non-Profit</h2>

	{#if loading}
		<p>Loading...</p>
	{:else if nonProfits.length === 0}
		<p>No non-profits available.</p>
	{:else}
    <div class="mt-4 flex w-full justify-center sm:w-[450px] md:w-[550px] lg:w-[650px]">
        {#each nonProfits as nonProfit}
				<Card.Root
					class={`relative mx-auto max-w-sm cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-lg ${
						favouriteNonProfitId === nonProfit.id
							? 'border-blue-500 bg-blue-100 dark:bg-blue-900'
							: ''
					}`}
					onclick={() => toggleFavouriteNonProfit(nonProfit.id)}
				>
					<!-- Green Checkmark for Selected -->
					{#if favouriteNonProfitId === nonProfit.id}
						<div
							class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md"
						>
							<Check size={16} />
						</div>
					{/if}

					<Card.Header>
						{#if nonProfit.photo_url}
							<img
								src={nonProfit.photo_url}
								alt={nonProfit.name}
								class="mb-2 h-32 w-full object-cover"
							/>
						{/if}
						<Card.Title>{nonProfit.name}</Card.Title>
						<Card.Description class="text-sm text-gray-600 dark:text-gray-300">
							{nonProfit.description}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<a href={nonProfit.website_url} target="_blank" class="text-blue-600 hover:underline">
							Visit Website
						</a>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
							Effective:
							{nonProfit.effective_start_date
								? new Date(nonProfit.effective_start_date).toISOString().split('T')[0]
								: 'Unknown'}
							-
							{nonProfit.effective_end_date
								? new Date(nonProfit.effective_end_date).toISOString().split('T')[0]
								: 'Ongoing'}
						</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Selected non-profit style */
	.selected {
		border-color: #3b82f6; /* Tailwind blue-500 */
		background-color: rgba(59, 130, 246, 0.1);
	}
</style>
