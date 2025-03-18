<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../../SvgLoader.svelte';
	import { AreaChart, LinearGradient, Area } from 'layerchart';

	let { title, modelName, dateFieldName } = $props();

	let client: TriplitClient;
	let loading = $state(true);
	let timeSeries: any = $state([]);

	function createTimeSeries(dbEntries: any) {
		const dateCountMap: any = {};

		// Count entries per day
		dbEntries.forEach((user: any) => {
			const date = new Date(user.created_at);
			const dateStr = date.toLocaleDateString('en-CA');
			if (dateCountMap[dateStr]) {
				dateCountMap[dateStr]++;
			} else {
				dateCountMap[dateStr] = 1;
			}
		});

		// Determine the date range
		const dates: any = Object.keys(dateCountMap).map((dateStr) => new Date(dateStr));
		const minDate = new Date(Math.min(...dates));
		const maxDate = new Date(Math.max(...dates));

		// Create an array of all dates in the range
		const allDates = [];
		for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
			allDates.push(new Date(d));
		}

		// Convert the map to an array of objects
		const timeSeriesData = Object.keys(dateCountMap).map((date) => {
			const dateObject = new Date(date);
			return {
				date: dateObject,
				value: dateCountMap[date] || 0
			};
		});

		return timeSeriesData;
	}

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client.query(modelName).select([dateFieldName]).order(dateFieldName, 'DESC').build(),
			(results) => {
				timeSeries = createTimeSeries(results);
				console.log('timeSeries for', modelName, timeSeries);
				loading = false;
			},
			(error) => {
				console.error('Error fetching data:', error, modelName);
				loading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

<div class="flex flex-col items-center justify-center p-6">
	<h1 class="m-1 text-xl">{title}</h1>
	{#if loading}
		<div class="flex w-full justify-center">
			<SvgLoader />
			<p>Loading...</p>
		</div>
	{:else if timeSeries === 0}
		<div class="mt-3 flex w-full justify-center">
			<p>None found.</p>
		</div>
	{:else}
		<div class="h-[300px] w-screen rounded border p-4">
			<AreaChart data={timeSeries} x="date" y="value">
				<svelte:fragment slot="marks">
					<LinearGradient class="from-primary/50 to-primary/0" vertical let:gradient>
						<Area line={{ class: 'stroke-primary' }} fill={gradient} />
					</LinearGradient>
				</svelte:fragment>
			</AreaChart>
		</div>
	{/if}
</div>
