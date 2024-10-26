<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider/index.js';

	const { data } = $props();

	// Set up the form
	const { form, errors, enhance, submitting } = superForm(data.form);

	// Initialize distortions based on enum, with default ratings from load
	let distortions = data.distortionRatings;
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="mb-5 text-xl">{data.thought.thought}</h1>

	<form method="post" use:enhance class="m-2 flex w-full max-w-md flex-col space-y-4">
		<div class="form-control grid w-full items-center gap-1.5">
			<!-- Render each cognitive distortion with a slider -->
			{#each distortions as { name, rating }, index}
				<div class="mt-4">
					<Label for="distortion-{index}">{name}</Label>
					<Slider id="distortion-{index}" bind:value={distortions[index].rating} min={0} max={100} step={1} />
					<input type="hidden" name="distortions[{name}]" value={distortions[index].rating} />
				</div>
			{/each}
		</div>
		<div class="flex w-full justify-center">
			<Button type="submit" disabled={$submitting} class="w-full max-w-64">
				{#if $submitting}
					<span class="loading loading-spinner"></span> Submitting...
				{:else}
					Continue
				{/if}
			</Button>
		</div>
	</form>
</div>
