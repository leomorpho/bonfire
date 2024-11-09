<script lang="ts">
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	const parties = [
		{
			name: 'Boardgames and Beers',
			time: 'July 18, 2024 at 6:30PM',
			host: 'Philip'
		},
		{
			name: 'Beer night with the bros',
			time: 'July 30, 2024 at 8:30PM',
			host: 'Jo'
		}
	];
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
		<h2 class="mb-4 text-lg font-semibold">Upcoming Bonfires</h2>
		{#each parties as party}
			<Card.Root class="w-full my-4 bg-slate-100">
				<Card.Header>
					<Card.Title>{party.name}</Card.Title>
					<Card.Description>{party.time}</Card.Description>
					<Card.Description>Hosted by {party.host}</Card.Description>
				</Card.Header>
				<Card.Content></Card.Content>
			</Card.Root>
		{/each}
	</section>
	<section class="mt-8 w-full sm:w-[450px]">
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
	</section>
</div>
<div class="fixed bottom-6 left-1/2 flex -translate-x-1/2 transform flex-col items-center">
	<button class="rounded-full bg-blue-500 p-4 text-white shadow-lg transition hover:bg-blue-600">
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
	</button>
	<span class="mt-2">Create a Bonfire</span>
</div>
