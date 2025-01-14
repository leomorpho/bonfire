<script lang="ts">
	import { tick } from 'svelte';
	import Google from '$lib/components/icons/Google.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { Mail } from 'lucide-svelte';
	import { Image } from '@unpic/svelte';
	import { tempAttendeeIdFormName, tempAttendeeIdUrlParam } from '$lib/enums.js';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const { data } = $props();

	let email_input: HTMLInputElement | null = $state(null);
	let show_email_input = $state(false);
	let email_sent = $state(false);
	let showPageLoader = $state(false);
	let otpInvalid = $state(false);

	import { OTPInput, OTPRoot } from '@jimmyverburgt/svelte-input-otp';
	import Minus from 'lucide-svelte/icons/minus';
	import LoaderPage from '$lib/components/LoaderPage.svelte';

	let otpref: any = $state();

	// Set start oneTimePasswordValue
	let oneTimePasswordValue = $state('');

	// Called when OTP input is complete
	async function handleOtpComplete(otp: string) {
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
				goto(data.location);
			} else {
				otpInvalid = true;
				console.log(data.error || 'OTP verification failed');
			}
		} catch (e) {
			console.error('failed to verify OTP', e);
		} finally {
			showPageLoader = false;
		}
	}

	function handleOtpChange(event: { detail: string }) {
		console.log('OTP changed:', oneTimePasswordValue);
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

	const tempAttendeeId = $page.url.searchParams.get(tempAttendeeIdUrlParam);
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
		{#if email_sent}
			<div class="text-center">
				<Mail size="40" class="mx-auto my-4" />
				<div class="text-3xl font-bold leading-none tracking-tight">Check your inbox</div>
				<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-lg opacity-80">
					We've sent you a one-time password to enter below. Please be sure to check your spam
					folder too.
				</div>
				<div class="mt-5 flex w-full justify-center text-2xl">
					<OTPRoot
						inputMode="numeric"
						ariaLabel="Svelte OTP Code"
						bind:this={otpref}
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
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={1}
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={2}
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
						</div>
						<div class="mx-1">
							<Minus />
						</div>
						<div class="flex items-center">
							<OTPInput
								index={3}
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={4}
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
								focusClassName="z-10 ring-2 ring-ring ring-offset-background"
							/>
							<OTPInput
								index={5}
								className="relative flex h-20 w-16 items-center justify-center border-y border-r border-input text-3xl transition-all first:rounded-l-md first:border-l last:rounded-r-md"
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
				<form id="otp-form" method="post" action="/login?/otpVerification" use:enhance>
					<input type="hidden" name="verification_token" bind:value={oneTimePasswordValue} />
					<button type="submit" class="text-md btn mt-5 w-full font-semibold sm:text-lg">
						Submit
					</button>
				</form>
			</div>
		{:else}
			<div class="my-4 flex w-full flex-col space-y-1.5 text-center">
				<div class="mx-auto w-fit max-w-64">
					<Image
						class="max-w-64 rounded-lg"
						height={834}
						width={1000}
						src="https://f002.backblazeb2.com/file/bonfire-public/logo/Bonfire_logo_vert_color.png"
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
				</a>{/if}

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
						class="input my-5 w-full"
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
