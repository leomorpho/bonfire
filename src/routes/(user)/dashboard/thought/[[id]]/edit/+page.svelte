<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from "$lib/components/ui/label";

	const { data } = $props();
	const { form, errors, enhance, submitting } = superForm(data.thoughtForm);
	
</script>

<div class="flex min-h-screen items-center justify-center">
	<form
		method="post"
		use:enhance
		class="m-2 flex w-full max-w-md flex-col space-y-4"
	>
		<div class="form-control grid w-full items-center gap-1.5">
			<Label for="thought">Enter your stressful thought:</Label>

			<Input
				bind:value={$form.thought}
				type="text"
				name="thought"
				id="thought"
				placeholder="What's on your mind?"
				class="w-full"
			/>
			<input type="hidden" name="thoughtId" value={data.thoughtId} />

			{#if $errors.thought}
				<span id="thought-error" class="text-sm text-red-500">
					{$errors.thought}
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
