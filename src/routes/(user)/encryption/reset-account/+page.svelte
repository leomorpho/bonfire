<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { waitForEThree } from '$lib/e3kit.js';
	import { onMount } from 'svelte';
	import { Buffer } from 'buffer';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	const { data } = $props();

	let submitting = $state(false);

	onMount(() => {
		window.Buffer = Buffer;
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

	// Submit handler
	async function handleSubmit(event: Event) {
		submitting = true;
		try {
			const eThree = await waitForEThree();
			console.log('resettting private key backup with virgil E3Kit');
			// @ts-ignore
			await eThree.resetPrivateKeyBackup();
			console.log('done resettting private key backup with virgil E3Kit');

			console.log('resetting account..');

			// Call server-side logic by sending a request to an endpoint
			const response = await fetch('reset-account');

			if (response.ok) {
				alert('Password reset successful!');
				goto('backup');
			} else {
				alert('Server-side reset failed.');
			}
			console.log('done resetting account.');
		} catch (error) {
			console.error('Account reset failed:', error);
			alert('Failed reset account.');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="m-2 flex min-h-screen flex-col items-center justify-center">
	<h1 class="m-4 mb-5 text-xl sm:text-2xl">Reset encryption password</h1>
	<div class="m-4 md:w-1/2">
		<p>All your data will be lost. You will be starting from a brand new slate.</p>
	</div>
	<Dialog.Root>
		<Dialog.Trigger><Button>Reset</Button></Dialog.Trigger>
		<Dialog.Content class="sm:max-w-[425px]">
			<Dialog.Header>
				<Dialog.Title>Reset Account</Dialog.Title>
				<Dialog.Description>
					All your past data will be lost. You will need to set a new encryption password in the
					next screen.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-4 items-center gap-4"></div>
				<div class="grid grid-cols-4 items-center gap-4"></div>
			</div>
			<Dialog.Footer>
				<Button type="submit" on:click={handleSubmit}>
					{#if submitting}
						<span class="loading loading-spinner"></span> Submitting...
					{:else}
						Yes, I understand
					{/if}</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
