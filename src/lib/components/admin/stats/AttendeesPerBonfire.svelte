<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import SvgLoader from '../../SvgLoader.svelte';
	import { BarChart } from 'layerchart';

	let { title = 'Attendees per bonfire' } = $props();

	let client: TriplitClient;
	let loading = $state(true);
	let frequencyMap: any = $state([]);

	function createFrequencyMap(events: any[]) {
		const eventAttendeeCount: any = {};

		events.forEach((event: any) => {
			const attendees = event.attendees.length;
			const tempAttendees = event.temporary_attendees.length;
			const numTotalAttendees = attendees + tempAttendees;

			if (eventAttendeeCount[numTotalAttendees]) {
				eventAttendeeCount[numTotalAttendees]++;
			} else {
				eventAttendeeCount[numTotalAttendees] = 1;
			}
		});

		// Determine the range of attendees
		const attendeeCounts = Object.keys(eventAttendeeCount).map(Number);
		const minAttendees = Math.min(...attendeeCounts);
		const maxAttendees = Math.max(...attendeeCounts);

		// Create a frequency map of attendee counts with zeros for missing values
		const frequencyMap: any = {};
		for (let i = minAttendees; i <= maxAttendees; i++) {
			frequencyMap[i] = eventAttendeeCount[i] || 0;
		}

		// Convert the map to an array of objects for charting
		const frequencyData = Object.keys(frequencyMap).map((count) => ({
			attendees: parseInt(count),
			events: frequencyMap[count]
		}));

		return frequencyData;
	}

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('events')
				.Include('attendees', (rel) => rel('attendees').Select(['id']))
				.Include('temporary_attendees', (rel) => rel('temporary_attendees').Select(['id'])),
			(events) => {
				frequencyMap = createFrequencyMap(events);
				console.log('frequencyMap', frequencyMap);
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
	{:else if frequencyMap === 0}
		<div class="mt-3 flex w-full justify-center">
			<p>None found.</p>
		</div>
	{:else}
		<div class="h-[300px] w-screen rounded border p-4">
			<BarChart data={frequencyMap} x="attendees" y="events" labels renderContext={'svg'} />
		</div>
	{/if}
</div>
