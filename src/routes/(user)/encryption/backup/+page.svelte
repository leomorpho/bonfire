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

	const { data } = $props();

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

	// Submit handler
	async function handleSubmit(event: Event) {
		// TODO: not ideal, if validatePasswords and form is force submitted it will still 
		// go through and set the password as "set" in BE (note that we don't save it, only save the fact it's been set)
		submitting = true;

		if (!validatePasswords(password, confirmPassword)) return;

		try {
			const eThree = await waitForEThree();
			// @ts-ignore
			await eThree.backupPrivateKey(password);
			alert('Encryption setup successful!');
			goto('/dashboard');
		} catch (error) {
			console.error('Encryption setup failed:', error);
			alert('Failed to set up encryption.');
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
	<form method="post" class="m-2 flex w-full max-w-md flex-col space-y-4" onsubmit={handleSubmit}>
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
