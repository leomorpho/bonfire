<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import { onMount } from 'svelte';

	const thoughtsList = writable($page.data.thoughts);

	onMount(() => {
		window.userId = $page.data.userId;
	});
</script>

<div class="mx-2 flex flex-col items-center justify-center">
	<div class="flex justify-center space-x-2">
		<!-- <Button href="/dashboard">Log new gratitude</Button> -->
		<Button href="/dashboard/thought">Log new stressful thought</Button>
	</div>

	<!-- History of thoughts and moods -->
	<section class="mt-8 w-full sm:w-[450px]">
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
