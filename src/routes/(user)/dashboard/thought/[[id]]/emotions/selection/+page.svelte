<script lang="ts">
	import SelectableBadge from '$lib/components/SelectableBadge.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Emotion } from '$lib/enums';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms';

	const { data } = $props();

	const { form, errors, enhance, submitting } = superForm(data.form);
	console.log(data.thought);
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="mb-1 text-xl">"{data.thought.thought}"</h1>
	<h2 class="mb-5">What do you <span class="italic">feel</span> when you believe this thought?</h2>

	<form action="?/save" method="post" use:enhance>
		<input type="hidden" name="thoughtId" value={data.thought?.id} />

		<!-- Iterate over each emotion category -->
		{#each Object.entries(Emotion) as [category, emotions]}
			<Card.Root class="mb-4 w-full sm:w-[450px]">
				<Card.Header>
					<Card.Title>{category}</Card.Title>
				</Card.Header>

				<Card.Content>
					<div class="flex flex-wrap gap-2">
						<!-- Render each emotion as a Badge within the category -->
						{#each Object.entries(emotions) as [emotionKey, emotionValue]}
							<SelectableBadge value={emotionKey} label={emotionValue} isSelected={data.thought.emotions?.includes(emotionKey)}/>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
		<div class="flex w-full justify-center space-x-1">
			<!-- <Button type="submit" formaction="?/prev" disabled={$submitting} class="w-1/2 max-w-64"
				>Previous</Button
			> -->
			<Button type="submit" disabled={$submitting} class="w-1/2 max-w-64">
				{#if $submitting}
					<span class="loading loading-spinner"></span> Submitting...
				{:else}
					Save
				{/if}
			</Button>
		</div>
	</form>
</div>
