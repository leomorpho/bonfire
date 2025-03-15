<script lang="ts">
	import { tick } from 'svelte';
	import Google from '$lib/components/icons/Google.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { ClipboardPaste, Mail } from 'lucide-svelte';
	import { Image } from '@unpic/svelte';
	import { tempAttendeeIdFormName, tempAttendeeSecretParam } from '$lib/enums.js';
	import { page } from '$app/stores';
	import { OTPInput, OTPRoot } from '@jimmyverburgt/svelte-input-otp';
	import Minus from 'lucide-svelte/icons/minus';
	import LoaderPage from '$lib/components/LoaderPage.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const { data } = $props();

	let email_input: HTMLInputElement | null = $state(null);
	let show_email_input = $state(true);
	let email_sent = $state(false);
	let showPageLoader = $state(false);
	let otpInvalid = $state(false);

	// Set start oneTimePasswordValue
	let oneTimePasswordValue = $state('');

	// Handle the paste event to capture pasted digits
	function handlePaste(event: ClipboardEvent) {
		// Ensure we only process the event if email_sent is true
		if (email_sent) {
			// Get the pasted content from the clipboard
			const pastedText = event.clipboardData?.getData('text') || '';

			// Filter out non-numeric characters from the pasted text
			const numericInput = pastedText.replace(/[^0-9]/g, '');

			if (numericInput && numericInput.length == 6) {
				// Update oneTimePasswordValue with the pasted numeric value
				oneTimePasswordValue = numericInput;
				console.log(`Pasted OTP value: ${oneTimePasswordValue}`);
				handleOtpComplete(oneTimePasswordValue);
			}
		}
	}

	async function handlePasteFromClipboard() {
		try {
			// Get the clipboard text
			const clipboardText = await navigator.clipboard.readText();

			// Filter out non-numeric characters from the clipboard text
			const numericInput = clipboardText.replace(/[^0-9]/g, '');

			if (numericInput && numericInput.length === 6) {
				// Update oneTimePasswordValue with the numeric value
				oneTimePasswordValue = numericInput;
				console.log(`Pasted OTP value: ${oneTimePasswordValue}`);
				handleOtpComplete(oneTimePasswordValue);
			} else {
				console.error('Clipboard does not contain a valid OTP.');
			}
		} catch (error) {
			console.error('Failed to read clipboard:', error);
		}
	}

	// Setup event listener for paste event when email_sent is true
	$effect(() => {
		if (email_sent) {
			console.log('Listening for paste events');
			document.addEventListener('paste', handlePaste); // Attach listener to the document
		} else {
			console.log('Not listening for paste events');
			document.removeEventListener('paste', handlePaste); // Detach listener if email_sent is false
		}
	});

	// Called when OTP input is complete
	async function handleOtpComplete(otp: string) {
		if (!email_sent) {
			return;
		}
		try {
			showPageLoader = true;
			console.log('OTP Complete:', otp);

			// Submit the OTP to the backend for validation
			const response = await fetch('/login/otp-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ otp })
			});
			console.log('response', response);
			const data = await response.json();
			console.log(data);

			// Check if the response indicates success
			if (data.success) {
				// Redirect to the location returned in the response
				window.location.href = data.location;
			} else {
				showPageLoader = false;
				otpInvalid = true;
				console.log(data.error || 'OTP verification failed');
			}
		} catch (e) {
			console.error('failed to verify OTP', e);
			showPageLoader = false;
		}
	}

	function handleOtpChange(event: { detail: string }) {
		if (email_sent) {
			console.log('OTP changed:', oneTimePasswordValue);
		}
	}

	const { enhance, errors, submitting } = superForm(data.form, {
		onResult(event) {
			console.log(event);
			if (event.result.type === 'success') {
				email_sent = true;
			}
		}
	});

	const handleEmail = async () => {
		if (!show_email_input && email_input) {
			show_email_input = true;
			await tick();
			email_input.focus();
		}
	};

	const tempAttendeeId = $page.url.searchParams.get(tempAttendeeSecretParam);
	console.log('tempAttendeeId', tempAttendeeId);
</script>

<svelte:head>
	<title>Bonfire</title>
	<meta
		name="description"
		content="Effortlessly organize your social gatherings with your friends and loved ones."
	/>
</svelte:head>

<div class="flex h-screen items-center justify-center p-5">
	<div class="card flex w-full max-w-[470px] flex-col p-5">
		{#if !email_sent && oneTimePasswordValue.length > 0}
			<div
				class="my-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-800 dark:text-yellow-300"
				role="alert"
			>
				<span class="font-medium">Oups!</span> One-time passwords can only be entered on the device you
				are currently logging into. This means the device where you entered your email, not the one you're
				currently on...
			</div>
		{/if}
		{#if email_sent}
			<div class="text-center">
				<Mail size="40" class="mx-auto my-4" />
				<div class="text-3xl font-bold leading-none tracking-tight">Check your inbox</div>
				<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-lg opacity-80">
					We've sent you a one-time password to enter below. Please be sure to check your spam
					folder too.
				</div>
				<Button onclick={handlePasteFromClipboard} class="mt-5 bg-green-500 hover:bg-green-400">
					<ClipboardPaste class="mr-1" />
					Paste from clipboard</Button
				>
				<div class="mb-5 mt-8 flex w-full justify-center sm:text-2xl" id="otp-entry">
					<OTPRoot
						inputMode="numeric"
						ariaLabel="OTP Code"
						maxLength={6}
						on:change={handleOtpChange}
						bind:value={oneTimePasswordValue}
						autoFocus={true}
						onComplete={handleOtpComplete}
						className="flex items-center gap-2"
					>
						<div class="flex items-center">
							<OTPInput
								index={0}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={1}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={2}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
						</div>
						<div class="mx-1">
							<Minus />
						</div>
						<div class="flex items-center">
							<OTPInput
								index={3}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={4}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={5}
								className="relative flex h-12 w-8 sm:h-14 sm:w-10 md:h-18 md:w-14 items-center justify-center border-y border-r border-input sm:text-xl md:text-2xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
						</div>
					</OTPRoot>
				</div>
				{#if otpInvalid}
					<div
						class="my-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-800 dark:text-yellow-300"
						role="alert"
					>
						<span class="font-medium">Oups!</span> Your code appears to be incorrect.
					</div>
				{/if}
				<!-- OTP Verification Form -->
				<div>
					<button
						class="text-md btn mt-5 w-full font-semibold dark:bg-slate-800 dark:text-white sm:text-lg"
					>
						Submit
					</button>
				</div>
			</div>
		{:else}
			<div class="my-4 flex w-full flex-col space-y-1.5 text-center">
				<div class="mx-auto w-fit max-w-64">
					<Image
						class="hidden max-w-64 rounded-lg sm:block"
						height={209}
						width={250}
						src="https://f002.backblazeb2.com/file/bonfire-public/logo/logo_Bonfire_logo_vert_color_250.png"
						layout="constrained"
						alt="Bonfire logo with name"
					/>
					<Image
						class="block max-w-64 rounded-lg sm:hidden"
						height={125}
						width={150}
						src="https://f002.backblazeb2.com/file/bonfire-public/logo/logo_Bonfire_logo_vert_color_150px.png"
						layout="constrained"
						alt="Bonfire logo with name"
					/>
				</div>
			</div>
			{#if data.user}
				<a href="/" class="text-md btn btn-primary mt-4 w-full font-semibold md:text-lg"
					>Continue with current account
				</a>
				<p class="my-3 text-center text-sm opacity-70">
					Signed in as {data.user.email}
				</p>
			{:else}
				<a href="/login/google" class="text-md btn btn-primary mt-4 w-full font-semibold md:text-lg"
					><Google class="mr-3 w-4" />Continue with Google
				</a>
			{/if}

			{#if data.user}
				<form method="post" action="/login?/signout">
					<button type="submit" class="text-md btn btn-ghost mt-2 w-full font-semibold sm:text-lg"
						>Sign in with a different account
					</button>
				</form>
			{:else}
				<form method="post" action="/login?/login_with_email" use:enhance>
					<!-- Add tempAttendeeId as a hidden input -->
					{#if tempAttendeeId}
						<input type="hidden" name={tempAttendeeIdFormName} value={tempAttendeeId} />
					{/if}

					<input
						bind:this={email_input}
						placeholder="Email"
						type="email"
						name="email"
						autocomplete="email"
						class="input my-5 w-full bg-slate-100 dark:bg-slate-800 dark:text-white"
						class:hidden={!show_email_input}
					/>
					{#if $errors.email}
						<span class="ml-1 mt-2 text-xs text-red-500">{$errors.email}</span>
					{/if}

					{#if show_email_input}
						<button
							type="submit"
							disabled={$submitting}
							class="text-md btn w-full font-semibold sm:text-lg"
						>
							{#if $submitting}
								<span class="loading loading-spinner loading-xs mr-2"></span>
							{/if}
							<span>Continue</span>
						</button>
					{:else}
						<button
							onclick={handleEmail}
							type="button"
							class="text-md btn mt-4 w-full font-semibold sm:text-lg"
							>Continue with email
						</button>{/if}
				</form>
			{/if}
		{/if}
	</div>
</div>
<LoaderPage show={showPageLoader} text={'Verifying...'} />
