<script lang="ts">
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import Loader from '$lib/components/Loader.svelte';
	import { Frown } from 'lucide-svelte';
	import { useQuery } from '@triplit/svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { page } from '$app/stores';

	let client: TriplitClient;

	let futureEvents = $state({});
	let pastEvents = $state({});
	let userId = $state('');

	function createEventsQuery(client: TriplitClient, currUserID: string, future: boolean) {
		let query = client
			.query('attendees')
			.where(['user_id', '=', currUserID])
			.where('event.start_time', future ? '>=' : '<', new Date().toISOString());

		return query.include('event').include('event.user').order('event.start_time', 'ASC');
	}

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const initEvents = async () => {
			userId = (await waitForUserId()) as string;

			// let pastEventsQuery = createEventsQuery(client, userId, true);
			// console.log('----> ??? ', await client.fetch(pastEventsQuery.build()));

			let query = client.query('events').build();
			console.log('all events this user can see', await client.fetch(query));
		};

		initEvents().catch((error) => {
			console.error('Failed to get events:', error);
		});
	});

	$effect(() => {
		if (userId) {
			let futureEventsQuery = createEventsQuery(client, userId, true);

			let pastEventsQuery = createEventsQuery(client, userId, false);

			futureEvents = useQuery(client, futureEventsQuery);

			pastEvents = useQuery(client, pastEventsQuery);
		}
	});
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Upcoming Bonfires</h2>
		{#if futureEvents.fetching}
			<Loader />
		{:else if futureEvents.error}
			<p>Error: {futureEvents.error.message}</p>
		{:else if futureEvents.results}
			{#if futureEvents.results.length == 0}
				<div class="flex items-center justify-center rounded-lg bg-slate-100 p-4">
					<Frown class="mr-2 h-4 w-4" />No events yet.
				</div>
			{:else}
				<div>
					{#each futureEvents.results as attendance}
						<EventCard
							event={attendance.event}
							{userId}
							eventCreatorName={attendance['event.user'].username}
							rsvpStatus={attendance.status}
						/>
					{/each}
				</div>
			{/if}
		{/if}
	</section>
	{#if pastEvents.fetching}
		<Loader />
	{:else if pastEvents.error}
		<p>Error: {pastEvents.error.message}</p>
	{:else if pastEvents.results}
		{#if pastEvents.results.length > 0}
			<Collapsible.Root class="w-full space-y-2 sm:w-[450px]">
				<div class="flex items-center justify-between space-x-4 px-4">
					<h4 class="text-sm font-semibold">{pastEvents.results.length} past events</h4>
					<Collapsible.Trigger
						class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'w-9 p-0' })}
					>
						<ChevronsUpDown />
						<span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>
				<Collapsible.Content class="space-y-2">
					{#each pastEvents.results as attendance}
						<EventCard
							event={attendance.event}
							{userId}
							eventCreatorName={attendance['event.user'].username}
							rsvpStatus={attendance.status}
						/>
					{/each}
				</Collapsible.Content>
			</Collapsible.Root>
		{/if}
	{/if}
</div>
<div class="fixed bottom-6 left-1/2 flex -translate-x-1/2 transform flex-col items-center">
	<a
		href="bonfire/create"
		class="rounded-full bg-blue-500 p-4 text-white shadow-lg transition hover:bg-blue-600"
	>
		<!-- Button Icon -->
		<svg
			class="h-6 w-6"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
		</svg>
	</a>
	<span class="mt-2">Create a Bonfire</span>
</div>
