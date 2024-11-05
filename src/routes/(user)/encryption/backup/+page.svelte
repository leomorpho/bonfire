<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/password-input/password-input.svelte';
	import { initE3Singleton, userIdStore, waitForEThree } from '$lib/e3kit.js';
	import { onMount } from 'svelte';
	import { Buffer } from 'buffer';
	import { page } from '$app/stores';

	const { data } = $props();
	const { form, errors, enhance, submitting } = superForm(data.form);

	let password = $state('');
	let confirmPassword = $state('');


	onMount(() => {
		window.Buffer = Buffer;

		userIdStore.set($page.data.user.id);
		const initEThree = async () => {
			// Ensure eThreeReady is initialized
			const eThree = await waitForEThree();
			console.log(`eThree....: ${eThree}`);
			// @ts-ignore
			await eThree.register();
		};

		initEThree().catch((error) => {
			console.error('Failed to register user to eThree:', error);
		});
	});

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

		// Ensure eThreeReady is initialized

		try {
			const eThree = await waitForEThree();
			// @ts-ignore
			await eThree
				// @ts-ignore
				.backupPrivateKey(password)
				.then(() => console.log('success'))
				// @ts-ignore
				.catch((e) => console.error('error: ', e));
			alert('Encryption setup successful!');
			goto('/dashboard');
		} catch (error) {
			console.error('Encryption setup failed:', error);
			alert('Failed to set up encryption.');
		}
	}
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="m-4 mb-5 text-xl sm:text-2xl">Let's set up your end-to-end encryption</h1>
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

		<div class="space-y-2">
			<Label for="confirmPassword">Confirm Password</Label>
			<PasswordInput type="password" bind:value={confirmPassword} required />
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
