<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { openDB } from 'idb';
	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/password-input/password-input.svelte';
	import { deriveEncryptionKey, savePassword } from '$lib/encryption.js';

	const { data } = $props();
	const { form, errors, enhance, submitting } = superForm(data.form);

	let password = $state('');
	let confirmPassword = $state('');

	// Generate a random salt as a Base64 string
	function generateSalt(): string {
		const randomArray = new Uint8Array(16); // 16 bytes for salt
		crypto.getRandomValues(randomArray);
		return btoa(String.fromCharCode(...randomArray));
	}

	let salt = generateSalt();

	// Validate password confirmation
	function validatePasswords() {
		if (password !== confirmPassword) {
			alert('Passwords do not match');
			return false;
		}
		return true;
	}

	// Submit handler
	async function handleSubmit() {
		if (!validatePasswords()) return;

		try {
			await savePassword(password);
			const key = await deriveEncryptionKey(password, salt);
			alert('Encryption setup successful!');
			goto('/dashboard');
		} catch (error) {
			console.error('Encryption setup failed:', error);
			alert('Failed to set up encryption.');
		}
	}
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="mb-5 text-xl">Set up encryption</h1>
	<form
		method="post"
		use:enhance
		class="m-2 flex w-full max-w-md flex-col space-y-4"
		onsubmit={handleSubmit}
	>
		<div class="space-y-2">
			<Label for="password">Password</Label>
			<PasswordInput type="password" bind:value={password} required />
		</div>

		<div class="space-y-2">
			<Label for="confirmPassword">Confirm Password</Label>
			<PasswordInput type="password" bind:value={confirmPassword} required />
		</div>
		<input type="hidden" name="salt" value={salt} />

		<div class="flex w-full justify-center space-x-1">
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
