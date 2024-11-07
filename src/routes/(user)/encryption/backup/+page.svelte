<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import PasswordInput from '$lib/components/password-input/password-input.svelte';
	import { userIdStore, waitForEThree } from '$lib/e3kit.js';
	import { onMount } from 'svelte';
	import { Buffer } from 'buffer';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import { getFlash } from 'sveltekit-flash-message';

	const { data } = $props();

	userIdStore.set($page.data.user.id);

	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);

	let minPassWordLen = $state(8);
	if (dev) {
		minPassWordLen = 3;
	}

	let passwordTooShort = $state(true);
	let passwordsNotEqual = $state(true);

	// Computed variable using $derived for submit button state
	let isSubmitDisabled = $derived(validatePasswords(password, confirmPassword));

	const flash = getFlash(page);

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
	function validatePasswords(password: string, confirmPassword: string) {
		if (password.length < minPassWordLen) {
			$effect(() => {
				passwordTooShort = true;
			});

			return true;
		} else {
			$effect(() => {
				passwordTooShort = false;
			});
		}
		if (password !== confirmPassword) {
			$effect(() => {
				passwordsNotEqual = true;
			});
			return true;
		} else {
			$effect(() => {
				passwordsNotEqual = false;
			});
		}
		return false;
	}

	async function handleSubmit(event: Event) {
		submitting = true;

		try {
			const eThree = await waitForEThree();
			// @ts-ignore
			await eThree.backupPrivateKey(password);
			console.log('Private key backed up to e3Kit');

			// Call server-side logic by sending a request to an endpoint
			const response = await fetch('backup');

			if (!response.ok) {
				throw new Error(
					`Failed to update backup status: ${response.status} ${response.statusText}`
				);
			}

			console.log('Update user in DB to show user backed up password');
			$flash = { type: 'success', message: 'Encryption setup successful!' };
			goto('/dashboard');
		} catch (error) {
			console.error('Encryption setup failed:', error);
			alert('Failed to set up encryption.');
			// Re-throw the error to prevent navigation on failure
			throw error;
		} finally {
			submitting = false;
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
	<form class="m-2 flex w-full max-w-md flex-col space-y-4" onsubmit={handleSubmit}>
		<div class="space-y-2">
			<Label for="password">Password</Label>
			<PasswordInput type="password" bind:value={password} required />
		</div>

		<div class="space-y-2">
			<Label for="confirmPassword">Confirm Password</Label>
			<PasswordInput type="password" bind:value={confirmPassword} required />
		</div>
		<div>
			<ul class="max-w-md list-inside list-disc space-y-1 text-yellow-500 dark:text-yellow-400">
				{#if passwordTooShort}
					<li>Password should be at least {minPassWordLen} characters long.</li>
				{/if}
				{#if passwordsNotEqual}
					<li>Passwords are not equal</li>
				{/if}
			</ul>
		</div>
		<div class="flex w-full justify-center space-x-1">
			<Button disabled={isSubmitDisabled} type="submit" class="w-1/2 max-w-64">
				{#if submitting}
					<span class="loading loading-spinner"></span> Submitting...
				{:else}
					Save
				{/if}
			</Button>
		</div>
	</form>
</div>
