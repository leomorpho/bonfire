<script lang="ts">
	import AILoader from '$lib/components/AILoader.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	const { data } = $props();

	const { form, errors, enhance, submitting } = superForm(data.form);

	// Loading state for AI distortions
	let loadingAI = $state(false);
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center space-y-4">
	<h1 class="mb-1 text-xl">"{data.thought.thought}"</h1>
	<h2 class="mb-5">What do you <span class="italic">feel</span> when you believe this thought?</h2>

	<form action="?/save" method="post" use:enhance>
		<input type="hidden" name="thoughtId" value={data.thought?.id} />

		<!-- Iterate over each emotion category -->
		{#each Object.entries(data.availableEmotions) as [category, emotions]}
			<Card.Root class="mb-4 w-full sm:w-[450px]">
				<Card.Header>
					<Card.Title>{category}</Card.Title>
				</Card.Header>

				<Card.Content>
					<div class="flex flex-wrap gap-2">
						<!-- Render each emotion as a Badge within the category -->
						{#each Object.entries(emotions) as [emotionKey, emotionValue]}
							<Button class="bg-gray-200 text-gray-900" disabled variant="outline">
								{emotionValue as string}
							</Button>
						{/each}
					</div>

					<Tabs.Root value="you" class="sm:w-[400px] mt-5">
						<Tabs.List class="grid w-full grid-cols-2">
							<Tabs.Trigger value="you">You</Tabs.Trigger>
							<Tabs.Trigger value="ai"
								>A.I.
								{#if loadingAI}
									<AILoader />
								{/if}
							</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="you">
							<Card.Root>
								<Card.Header>
									<Card.Title>What benefits does this bring you?</Card.Title>
									<Card.Description class="h-5 sm:h-7">
										Even negative emotions serve a purpose. Write a genuine positive thing this does/did for you.
									</Card.Description>
								</Card.Header>
								<form action="?/next" method="post" use:enhance>
									<Card.Content class="mt-3 space-y-2"><Textarea /></Card.Content>
								</form>
							</Card.Root>
						</Tabs.Content>
						<Tabs.Content value="ai">
							{#if loadingAI}
								<div class="flex h-full items-center justify-center">
									<span class="loading loading-spinner">Loading AI Analysis...</span>
								</div>
							{:else}
								<Card.Root>
									<Card.Header>
										<Card.Title>What benefits does this bring you?</Card.Title>
										<Card.Description class="h-5 sm:h-7"
											>This is how our AI thinks it may have helped you.</Card.Description
										>
									</Card.Header>
									<Card.Content class="space-y-2"></Card.Content>
								</Card.Root>
							{/if}
						</Tabs.Content>
					</Tabs.Root>
				</Card.Content>
			</Card.Root>
		{/each}
		<div class="flex w-full justify-center space-x-1">
			<Button type="submit" formaction="?/prev" disabled={$submitting} class="w-1/2 max-w-64"
				>Previous</Button
			>
			<Button type="submit" disabled={$submitting} class="w-1/2 max-w-64">
				{#if $submitting}
					<span class="loading loading-spinner"></span> Submitting...
				{:else}
					Continue
				{/if}
			</Button>
		</div>
	</form>
</div>
