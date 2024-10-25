<script lang="ts">
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

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
	<form method="post" action="/dashboard/thought?/createThought" use:enhance class="space-y-4">
		<div class="form-control">
			<label for="thought" class="label">
				<span class="label-text">Enter your thought</span>
			</label>
			<input
				bind:this={thought_input}
                bind:value={$form.thought}
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
    </div>