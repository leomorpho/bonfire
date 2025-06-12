<script lang="ts">
	import { tick } from 'svelte';
	import Google from '$lib/components/icons/Google.svelte';
	import { ClipboardPaste, Mail, Phone } from 'lucide-svelte';
	import { Image } from '@unpic/svelte';
	import {
		tempAttendeeIdInForm,
		tempAttendeeSecretParam,
		tempAttendeeSecretStore
	} from '$lib/enums.js';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { getNextTheme } from '$lib/styles.js';
	import PhoneInput from '$lib/jsrepo/ui/phone-input/phone-input.svelte';
	import type { CountryCode } from 'svelte-tel-input/types';
	import { enhance } from '$app/forms';

	const { data } = $props();

	let showPageLoader = $state(false);
	let email_input: HTMLInputElement | null = $state(null);
	let show_input = $state(true);
	let code_sent = $state(false);
	let otpInvalid = $state(false);
	let login_method = $state<'email' | 'phone'>('phone');
	let phone_number = $state('');
	let phone_country = $state<CountryCode | null>('CA');
	let phone_valid = $state(false);

	// Pending RSVP data from URL params
	let pendingRSVP = $state<{ eventId?: string; rsvpStatus?: string; numGuests?: number } | null>(
		null
	);

	// Set start oneTimePasswordValue
	let oneTimePasswordValue = $state('');

	$effect(() => {
		if (oneTimePasswordValue.length == 6) {
			handleOtpComplete(oneTimePasswordValue);
		}
	});

	// Load pending RSVP data from URL params
	$effect(() => {
		const eventId = $page.url.searchParams.get('eventId');
		const rsvpStatus = $page.url.searchParams.get('rsvpStatus');
		const numGuests = $page.url.searchParams.get('numGuests');

		if (eventId && rsvpStatus) {
			pendingRSVP = {
				eventId,
				rsvpStatus,
				numGuests: numGuests ? parseInt(numGuests, 10) : 0
			};
		} else {
			pendingRSVP = null;
		}
	});

	// Handle the paste event to capture pasted digits
	function handlePaste(event: ClipboardEvent) {
		// Ensure we only process the event if code_sent is true
		if (code_sent) {
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

	// Setup event listener for paste event when code_sent is true
	$effect(() => {
		if (code_sent) {
			console.log('Listening for paste events');
			document.addEventListener('paste', handlePaste); // Attach listener to the document
		} else {
			console.log('Not listening for paste events');
			document.removeEventListener('paste', handlePaste); // Detach listener if code_sent is false
		}
	});

	// Called when OTP input is complete
	async function handleOtpComplete(otp: string) {
		if (!code_sent) {
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
				// RSVP data will be handled by the server via form submission
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

	// Manual state management instead of superForm
	let emailSubmitting = $state(false);
	let phoneSubmitting = $state(false);
	let emailErrors = $state<{ email?: string[] }>({});
	let phoneErrors = $state<{ phone_number?: string[] }>({});

	const handleEmailSubmit = () => {
		emailSubmitting = true;
		return async ({ result }: any) => {
			emailSubmitting = false;
			console.log('Email result:', result);

			if (result.type === 'success') {
				code_sent = true;
				emailErrors = {};
			} else if (result.type === 'failure') {
				emailErrors = result.data?.form?.errors || {};
			}
		};
	};

	const handlePhoneSubmit = () => {
		phoneSubmitting = true;
		return async ({ result }: any) => {
			phoneSubmitting = false;
			console.log('Phone result:', result);

			if (result.type === 'success') {
				code_sent = true;
				phoneErrors = {};
			} else if (result.type === 'failure') {
				phoneErrors = result.data?.form?.errors || {};
			}
		};
	};

	const handleEmail = async () => {
		if (!show_input && email_input) {
			show_input = true;
			await tick();
			email_input.focus();
		}
	};

	const handlePhone = async () => {
		if (!show_input) {
			show_input = true;
		}
	};

	const switchLoginMethod = (method: 'email' | 'phone') => {
		login_method = method;
		show_input = true;
	};

	const tempAttendeeId =
		$page.url.searchParams.get(tempAttendeeSecretParam) || tempAttendeeSecretStore.get();
	console.log('tempAttendeeId', tempAttendeeId);

	let styles = $state('');

	const getRandomTheme = () => {
		styles = getNextTheme();
	};

	getRandomTheme();
</script>

<svelte:head>
	<title>Bonfire</title>
	<meta
		name="description"
		content="Effortlessly organize your social gatherings with your friends and loved ones."
	/>
</svelte:head>

<div style={styles} class="h-[90vh]">
	<div class="flex h-[90vh] items-center justify-center bg-slate-100/80 p-5 dark:bg-slate-900/90">
		<div class="card flex w-full max-w-[470px] flex-col p-5">
			{#if !code_sent && oneTimePasswordValue.length > 0}
				<div
					class="my-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-700 dark:text-yellow-300"
					role="alert"
				>
					<span class="font-medium">Oups!</span> One-time passwords can only be entered on the
					device you are currently logging into. This means the device where you entered your {login_method ===
					'email'
						? 'email'
						: 'phone number'}, not the one you're currently on...
				</div>
			{/if}
			{#if code_sent}
				<div class="text-center">
					{#if login_method === 'email'}
						<Mail size="40" class="mx-auto my-4" />
						<div class="text-3xl font-bold leading-none tracking-tight">Check your inbox</div>
						<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-lg opacity-80">
							We've sent you a one-time password to enter below. Please be sure to check your spam
							folder too.
						</div>
					{:else}
						<Phone size="40" class="mx-auto my-4" />
						<div class="text-3xl font-bold leading-none tracking-tight">Check your phone</div>
						<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-lg opacity-80">
							We've sent you a one-time password via SMS to enter below.
						</div>
					{/if}
					<Button onclick={handlePasteFromClipboard} class="mt-5 bg-green-500 hover:bg-green-400">
						<ClipboardPaste class="mr-1" />
						Paste from clipboard</Button
					>
					<div class="mb-5 mt-8 flex w-full justify-center sm:text-2xl" id="otp-entry">
						<InputOTP.Root
							maxlength={6}
							bind:value={oneTimePasswordValue}
							pattern={REGEXP_ONLY_DIGITS}
						>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells.slice(0, 3) as cell}
										<InputOTP.Slot
											{cell}
											class="md:h-18 relative flex h-12 w-8 items-center justify-center border-y border-r border-input bg-slate-100 transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:bg-slate-900 sm:h-14 sm:w-10 sm:text-xl md:w-14 md:text-2xl"
										/>
									{/each}
								</InputOTP.Group>
								<InputOTP.Separator />
								<InputOTP.Group>
									{#each cells.slice(3, 6) as cell}
										<InputOTP.Slot
											{cell}
											class="md:h-18 relative  flex h-12 w-8 items-center justify-center border-y border-r border-input bg-slate-100 transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:bg-slate-900 sm:h-14 sm:w-10 sm:text-xl md:w-14 md:text-2xl"
										/>
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
					</div>
					{#if otpInvalid}
						<div
							class="my-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-gray-700 dark:text-yellow-300"
							role="alert"
						>
							<span class="font-medium">Oups!</span> Your code appears to be incorrect.
						</div>
					{/if}
					<!-- OTP Verification Form -->
					<div>
						<Button
							class="text-md mt-5 w-full  dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 sm:text-lg"
						>
							Submit
						</Button>
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

					{#if pendingRSVP}
						<div
							class="mt-4 rounded-lg bg-blue-50 p-4 text-center text-sm text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
						>
							<strong>Almost there!</strong> Sign in to RSVP "{pendingRSVP.rsvpStatus}" for this
							event.
						</div>
					{/if}
				</div>
				{#if data.user}
					<Button href="/" class="mt-4 w-full  md:text-lg">Continue with current account</Button>
					<p class="my-3 text-center text-sm opacity-70">
						Signed in as {data.user.email}
					</p>
				{:else}
					<Button
						href={pendingRSVP
							? `/login/google?eventId=${pendingRSVP.eventId}&rsvpStatus=${pendingRSVP.rsvpStatus}&numGuests=${pendingRSVP.numGuests || 0}`
							: '/login/google'}
						class="mt-4 w-full bg-blue-500  text-white hover:bg-blue-400 dark:bg-blue-600 dark:hover:bg-blue-500 md:text-lg"
						><Google class="mr-3 w-4" />Continue with Google
					</Button>
				{/if}

				{#if data.user}
					<form method="post" action="/login?/signout">
						<Button type="submit" class="btn-ghost mt-2 w-full  sm:text-lg"
							>Sign in with a different account
						</Button>
					</form>
				{:else}
					<!-- Tabs for choosing login method -->
					<div class="mt-5 w-full">
						<div
							class="inline-flex h-9 w-full items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
						>
							<button
								id="use-phone-login-btn"
								type="button"
								onclick={() => switchLoginMethod('phone')}
								class="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
								class:bg-background={login_method === 'phone'}
								class:text-foreground={login_method === 'phone'}
								class:shadow={login_method === 'phone'}
							>
								<Phone size={16} />
								Phone
							</button>
							<button
								id="use-email-login-btn"
								type="button"
								onclick={() => switchLoginMethod('email')}
								class="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
								class:bg-background={login_method === 'email'}
								class:text-foreground={login_method === 'email'}
								class:shadow={login_method === 'email'}
							>
								<Mail size={16} />
								Email
							</button>
						</div>

						<!-- Email Login Form -->
						{#if login_method === 'email'}
							<form method="post" action="/login?/login_with_email" use:enhance={handleEmailSubmit}>
								<!-- Add tempAttendeeId as a hidden input -->
								{#if tempAttendeeId}
									<input type="hidden" name={tempAttendeeIdInForm} value={tempAttendeeId} />
								{/if}
								<!-- Add pending RSVP data as hidden inputs -->
								{#if pendingRSVP}
									<input type="hidden" name="eventId" value={pendingRSVP.eventId} />
									<input type="hidden" name="rsvpStatus" value={pendingRSVP.rsvpStatus} />
									<input type="hidden" name="numGuests" value={pendingRSVP.numGuests || 0} />
								{/if}

								<input
									bind:this={email_input}
									placeholder="Email"
									type="email"
									name="email"
									autocomplete="email"
									class="input my-5 w-full bg-slate-200 dark:bg-slate-800 dark:text-white"
									class:hidden={!show_input}
								/>
								{#if emailErrors.email}
									<span class="ml-1 mt-2 text-xs text-red-500">{emailErrors.email[0]}</span>
								{/if}

								{#if show_input}
									<Button type="submit" disabled={emailSubmitting} class="w-full sm:text-lg">
										{#if emailSubmitting}
											<span class="loading loading-spinner loading-xs mr-2"></span>
										{/if}
										<span>Continue</span>
									</Button>
								{:else}
									<Button onclick={handleEmail} type="button" class="mt-4 w-full sm:text-lg"
										>Continue with email
									</Button>
								{/if}
							</form>
						{:else}
							<!-- Phone Login Form -->
							<form method="post" action="/login?/login_with_phone" use:enhance={handlePhoneSubmit}>
								<!-- Add tempAttendeeId as a hidden input -->
								{#if tempAttendeeId}
									<input type="hidden" name={tempAttendeeIdInForm} value={tempAttendeeId} />
								{/if}
								<!-- Add pending RSVP data as hidden inputs -->
								{#if pendingRSVP}
									<input type="hidden" name="eventId" value={pendingRSVP.eventId} />
									<input type="hidden" name="rsvpStatus" value={pendingRSVP.rsvpStatus} />
									<input type="hidden" name="numGuests" value={pendingRSVP.numGuests || 0} />
								{/if}

								<div class="my-5 flex w-full justify-center" class:hidden={!show_input}>
									<PhoneInput
										bind:value={phone_number}
										bind:country={phone_country}
										bind:valid={phone_valid}
										defaultCountry="US"
										name="phone"
										placeholder="Phone number"
										class="w-full bg-slate-200 dark:bg-slate-800 dark:text-white"
										options={{
											spaces: true,
											autoPlaceholder: false,
											format: 'national'
										}}
									/>
									<input type="hidden" name="phone_number" bind:value={phone_number} />
									<input type="hidden" name="phone_country" bind:value={phone_country} />
								</div>
								{#if phoneErrors.phone_number}
									<span class="ml-1 mt-2 text-xs text-red-500">{phoneErrors.phone_number[0]}</span>
								{/if}

								{#if show_input}
									<Button
										type="submit"
										disabled={phoneSubmitting || !phone_valid}
										class="w-full sm:text-lg"
									>
										{#if phoneSubmitting}
											<span class="loading loading-spinner loading-xs mr-2"></span>
										{/if}
										<span>Continue</span>
									</Button>
								{:else}
									<Button onclick={handlePhone} type="button" class="mt-4 w-full sm:text-lg"
										>Continue with phone
									</Button>
								{/if}
							</form>
						{/if}
					</div>
				{/if}
			{/if}
			<p class="mt-5 flex text-center text-sm">
				Personalize your events by updating the background and font to match your style!
			</p>
		</div>
	</div>
</div>
<!-- <LoaderPage show={showPageLoader} text={'Verifying...'} /> -->
