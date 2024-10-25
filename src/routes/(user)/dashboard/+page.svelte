<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';

	let thought_input: HTMLInputElement | null = null;

	const { data } = $props();
	const { form, errors, enhance, submitting } = superForm(data.thoughtForm);

	onMount(() => {
		// Automatically focus the input on page load
		if (thought_input) {
			thought_input.focus();
		}
	});
</script>

<div class="m-5">
	<form method="post" action="/dashboard?/createThought" use:enhance class="space-y-4">
		<div class="form-control">
			<label for="thought" class="label">
				<span class="label-text">Enter your thought</span>
			</label>
			<input
				bind:this={thought_input}
				type="text"
				name="thought"
				id="thought"
				class="input input-bordered w-full"
				placeholder="What’s on your mind?"
				aria-invalid={$errors.thought ? 'true' : 'false'}
				aria-describedby="thought-error"
			/>
			{#if $errors.thought}
				<span id="thought-error" class="text-red-500 text-sm">
					{$errors.thought}
				</span>
			{/if}
		</div>

		<button type="submit" class="btn btn-primary w-full" disabled={$submitting}>
			{#if $submitting}
				<span class="loading loading-spinner"></span> Submitting...
			{:else}
				Continue
			{/if}
		</button>
	</form>

	<!-- History of thoughts and moods -->
	<section class="mt-8">
		<h2 class="text-lg font-semibold mb-4">Your Thoughts History</h2>
		<!-- This section should loop through and display historical data -->
		<div class="space-y-2">
			<!-- Placeholder, this would be dynamically generated -->
			<div class="p-4 border border-gray-300 rounded-lg shadow-sm">
				<p class="text-gray-800">Example thought content...</p>
				<p class="text-sm text-gray-500">Mood: Happy</p>
			</div>
			<!-- Repeat similar blocks for each historical entry -->
		</div>
	</section>
</div>
