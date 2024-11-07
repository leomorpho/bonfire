<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/password-input/password-input.svelte';
	import { onMount } from 'svelte';
	import { userIdStore, waitForEThree } from '$lib/e3kit.js';
	import { page } from '$app/stores';
	import { getFlash } from 'sveltekit-flash-message';

	const { data } = $props();
	const { form, errors, enhance, submitting } = superForm(data.form);

	userIdStore.set($page.data.user.id);

	let password = $state('');

	const flash = getFlash(page);

	onMount(() => {
		const initEThree = async () => {
			// Ensure eThreeReady is initialized
			const eThree = await waitForEThree();
			// @ts-ignore
			const hasLocalPrivateKey = await eThree.hasLocalPrivateKey();
			if (hasLocalPrivateKey) {
				goto('/dashboard');
			}
		};

		initEThree().catch((error) => {
			console.error('Failed to initialize eThree:', error);
		});
	});

	// Submit handler
	async function handleSubmit() {
		try {
			const eThree = await waitForEThree();

			// @ts-ignore
			await eThree.restorePrivateKey(password);
			$flash = { type: 'success', message: 'Decryption successful!' };

			goto('/dashboard');
		} catch (error) {
			console.error('Decryption setup failed:', error);
			alert('Failed to decrypt your data.');
		}
	}
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="m-4 mb-5 text-xl sm:text-2xl">Decrypt Your Data</h1>
	<div class="m-4 md:w-1/2">
		<p>
			What is it for? It will protect your data as only you will be able to read sensitive fields
			you input.
		</p>
		<p class="mt-3">
			Do not forget this password, else your data will be lost and you will need to reset your
			account. Store you password in a secure place, such as a password manager. It will be required
			to access your data on any new device or browser.
		</p>
	</div>
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
