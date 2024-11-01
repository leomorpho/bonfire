<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import PasswordInput from '$lib/components/password-input/password-input.svelte';
	import { openDB } from 'idb';
	import { goto } from '$app/navigation';

	// SvelteKit superforms setup
	const { form, errors, enhance, submitting } = superForm();

	let password = '';
	let salt = ''; // The salt fetched from the server or stored previously

	// Secure storage in IndexedDB
	async function getDatabase() {
		return openDB('encryption-store', 1, {
			upgrade(db) {
				db.createObjectStore('secure', { keyPath: 'id' });
			}
		});
	}

	// Save password in secure storage
	async function savePassword(password: string) {
		const db = await getDatabase();
		await db.put('secure', { id: 'user-password', password });
	}

	// Key derivation
	async function deriveDecryptionKey(password: string, salt: string) {
		const encoder = new TextEncoder();
		const baseKey = await crypto.subtle.importKey(
			'raw',
			encoder.encode(password),
			'PBKDF2',
			false,
			['deriveKey']
		);

		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: encoder.encode(salt),
				iterations: 100000,
				hash: 'SHA-256'
			},
			baseKey,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	// Submit handler
	async function handleSubmit() {
		try {
			const key = await deriveDecryptionKey(password, salt);
			await savePassword(password); // Save the password in secure storage
			alert('Decryption key derived and password stored!');
			goto('/dashboard'); // Redirect to dashboard
		} catch (error) {
			console.error('Failed to derive decryption key:', error);
			alert('Decryption failed. Please check your password.');
		}
	}
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="mb-5 text-xl">Decrypt Data</h1>
	<form
		method="post"
		use:enhance
		class="m-2 flex w-full max-w-md flex-col space-y-4"
		onsubmit={handleSubmit}
	>
		<div class="space-y-2">
			<Label for="password">Enter Password</Label>
			<PasswordInput type="password" bind:value={password} required />
		</div>

		<div class="flex w-full justify-center space-x-1">
			<Button type="submit" disabled={$submitting} class="w-1/2 max-w-64">
				{#if $submitting}
					<span class="loading loading-spinner"></span> Submitting...
				{:else}
					Decrypt
				{/if}
			</Button>
		</div>
	</form>
</div>
