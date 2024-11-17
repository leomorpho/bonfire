<script lang="ts">
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import { onMount } from 'svelte';
	import type { TriplitClient } from '@triplit/client';
	import { Cog } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Loader from '$lib/components/Loader.svelte';

	let events: any = null;
	let client = feTriplitClient as TriplitClient;

	let userId = '';
	onMount(() => {
		const initEvents = async () => {
			userId = (await waitForUserId()) as string;
			console.log(userId);
			let query = client.query('events').where(['user_id', '=', userId]).include('user').build();
			// events = await client.fetch(query, { policy: 'local-and-remote' });

			client.subscribe(query, (e) => {
				console.log(e);
				events = e;
			});
			// console.log(events);
		};

		initEvents().catch((error) => {
			console.error('Failed to get events:', error);
		});
	});
</script>

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Upcoming Bonfires</h2>
		{#if !events}
			<Loader />
		{:else}
			<div>
				{#each events as event}
					<a href={`/bonfire/${event.id}`}>
						<Card.Root class="my-4 w-full bg-slate-100">
							<Card.Header>
								<Card.Title class="text-lg">{event.title}</Card.Title>
								<Card.Description>{formatHumanReadable(event.start_time)}</Card.Description>
								<Card.Description>Hosted by {event.user.username}</Card.Description>
							</Card.Header>
							<Card.Content></Card.Content>
							{#if event.user_id == (userId as string)}
								<a href={`/bonfire/${event.id}/update`}>
									<Button variant="outline" class="m-2 rounded-full">
										<Cog class="h-5 w-5" />
									</Button>
								</a>
							{/if}
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</section>
	<!-- <section class="mt-8 w-full sm:w-[450px]">
		<Collapsible.Root class="w-full space-y-2">
			<div class="flex items-center justify-between space-x-4 px-4">
				<h4 class="text-sm font-semibold">3 past bonfires</h4>
				<Collapsible.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="sm" class="w-9 p-0">
						<CaretSort class="h-4 w-4" />
						<span class="sr-only">Toggle</span>
					</Button>
				</Collapsible.Trigger>
			</div>
			<div class="rounded-md border px-4 py-3 font-mono text-sm">Joe's 30th</div>
			<Collapsible.Content class="space-y-2">
				<div class="rounded-md border px-4 py-3 font-mono text-sm">Mel & Gibson 2024</div>
				<div class="rounded-md border px-4 py-3 font-mono text-sm">Aquarium Party</div>
			</Collapsible.Content>
		</Collapsible.Root>
	</section> -->
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
