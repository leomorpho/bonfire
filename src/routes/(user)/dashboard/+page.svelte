<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	const thoughtsList = writable($page.data.thoughts);
</script>

<div class="m-5">
	<div class="flex justify-center">
		<Button href="/dashboard/thought">Log new stressful thought</Button>
	</div>

	<!-- History of thoughts and moods -->
	<section class="mt-8">
		<h2 class="mb-4 text-lg font-semibold">Your Thoughts History</h2>
		{#if $thoughtsList.length > 0}
			<div class="space-y-2">
				{#each $thoughtsList as thought}
					<Card.Root class="w-full">
						<Card.Header>
							<Card.Title>{thought.thought}</Card.Title>
							<Card.Description
								>Created at: {new Date(thought.createdAt).toLocaleString()}</Card.Description
							>
						</Card.Header>
						<Card.Content>
							<!-- Add info on work progress on this thought -->
						</Card.Content>
						<Card.Footer class="flex justify-between">
							<Button variant="outline"
								><svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="lucide lucide-ellipsis w-4 h-4"
									><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle
										cx="5"
										cy="12"
										r="1"
									/></svg
								></Button
							>
							<Button href={`/dashboard/thought/${thought.id}/work`}>Work</Button>
						</Card.Footer>
					</Card.Root>
				{/each}
			</div>
		{:else}
			<p class="text-gray-600">
				No thoughts recorded yet. Start by adding your first thought above.
			</p>
		{/if}
	</section>
</div>
