<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../../SvgLoader.svelte';
	import { AreaChart, LinearGradient, Area } from 'layerchart';

	let { title = 'Attendees per bonfire' } = $props();

	let client: TriplitClient;
	let loading = $state(true);
	let frequencyMap: any = $state([]);

	async function createFrequencyMap(attendees: any[], temporaryAttendees: any[]) {
		const eventAttendeeCount: any = {};

		// Combine attendees and temporary attendees
		const allAttendees = [...attendees, ...temporaryAttendees];

		// Count attendees per event
		allAttendees.forEach((entry: any) => {
			const eventId = entry.event_id;
			if (eventAttendeeCount[eventId]) {
				eventAttendeeCount[eventId]++;
			} else {
				eventAttendeeCount[eventId] = 1;
			}
		});

		// Create a frequency map of attendee counts
		const frequencyMap: any = {};
		Object.values(eventAttendeeCount).forEach((count) => {
			if (frequencyMap[count]) {
				frequencyMap[count]++;
			} else {
				frequencyMap[count] = 1;
			}
		});

		// Convert the map to an array of objects for charting
		const frequencyData = Object.keys(frequencyMap).map((count) => ({
			attendees: parseInt(count),
			events: frequencyMap[count]
		}));

		return frequencyData;
	}

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const initData = async () => {
			const attendees = await client.fetch(
				client.query('attendees').select(['id', 'event_id']).build()
			);

			const temporaryAttendees = await client.fetch(
				client.query('temporary_attendees').select(['id', 'event_id']).build()
			);

			frequencyMap = await createFrequencyMap(attendees, temporaryAttendees);
			console.log('frequencyMap', frequencyMap);
			loading = false;
		};

		initData();
	});
</script>

<div class="flex flex-col items-center justify-center p-6">
	<h1 class="m-1 text-xl">{title}</h1>
	{#if loading}
		<div class="flex w-full justify-center">
			<SvgLoader />
			<p>Loading...</p>
		</div>
	{:else if frequencyMap === 0}
		<div class="mt-3 flex w-full justify-center">
			<p>None found.</p>
		</div>
	{:else}
		<div class="h-[300px] w-full rounded border p-4">
			<AreaChart data={frequencyMap} x="date" y="value">
				<svelte:fragment slot="marks">
					<LinearGradient class="from-primary/50 to-primary/0" vertical let:gradient>
						<Area line={{ class: 'stroke-primary' }} fill={gradient} />
					</LinearGradient>
				</svelte:fragment>
			</AreaChart>
		</div>
	{/if}
</div>
