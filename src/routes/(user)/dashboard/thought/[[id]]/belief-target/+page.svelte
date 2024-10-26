<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider/index.js';

	const { data } = $props();
	console.log(data.thought)
	const { form, errors, enhance, submitting } = superForm(data.form);
	let beliefRating = $state([50]); // Default value

	
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="mb-5 text-xl">{data.thought.thought}</h1>
	<form method="post" use:enhance class="m-2 flex w-full max-w-md flex-col space-y-4">
		<div class="form-control grid w-full items-center gap-1.5">
			<Label for="belief">What would be an acceptable level to bring down your belief to?</Label>

			<Slider id="belief" bind:value={beliefRating} min={0} max={100} step={1} />
			<input type="hidden" name="beliefRating" value={beliefRating} />
			<!-- Hidden input to submit the value -->
			<input type="hidden" name="thoughtId" value={data.thought?.id} />
			<!-- Assuming you have thoughtId from props -->

			{#if $errors}
				<span id="thought-error" class="text-sm text-red-500">
					{$errors.beliefRating}
				</span>
				<span id="thought-error" class="text-sm text-red-500">
					{$errors.thoughtId}
				</span>
			{/if}
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
