<script lang="ts">
	import type { CountryCode } from 'svelte-tel-input/types';
	import { OTPInput, OTPRoot } from '@jimmyverburgt/svelte-input-otp';
	import Button from '$lib/components/ui/button/button.svelte';
	import { PhoneInput } from '$lib/jsrepo/ui/phone-input';
	import { toast } from 'svelte-sonner';
	import { Minus } from 'lucide-svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { togglePermission } from '$lib/permissions';
	import { DeliveryPermissions } from '$lib/enums';

	let { userId } = $props();

	let phoneNumber: string | null = $state(null);
	let country: CountryCode | null = $state('CA');
	let isPhoneNumberValid: boolean = $state(false);

	let verificationCode: string = $state('');
	let verificationCodeInput: string = $state('');
	let isSendingVerificationCode: boolean = $state(false);
	let isVerifying = $state(false);
	let otpInvalid = $state(false);
	let verificationSent = $state(false);

	async function sendVerificationCode() {
		if (!phoneNumber) {
			return;
		}
		isSendingVerificationCode;
		verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

		if (dev) {
			console.log('verificationCode', verificationCode);
		}
		try {
			const response = await fetch('/settings/phone/send-verification-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ verificationCode, userPhoneNumber: phoneNumber })
			});

			const result = await response.json();

			if (response.ok) {
				console.log(result.message); // Handle success
			} else {
				console.error(result.message); // Handle error
				throw new Error('failed to send verification code');
			}
			verificationSent = true;
			toast.info('Verification code sent!');
		} catch (error) {
			console.error('Failed to send verification code', error);
			toast.error('Failed to send verification code. Please try again.');
		} finally {
			isSendingVerificationCode = false;
		}
	}

	async function verifyCode() {
		if (verificationCodeInput.length != 6) {
			console.log('verification has wrong length', verificationCodeInput);
			return;
		}
		if (verificationCode != verificationCodeInput) {
			toast.error('Verification code is incorrect, please try again.');
			return;
		}

		isVerifying = true;

		try {
			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

			await client.http.insert('user_personal_data', {
				id: 'upd_' + userId,
				user_id: userId,
				phone_country_code: country,
				phone_number: phoneNumber
			});
			await togglePermission(client, userId, null, DeliveryPermissions.sms_notifications, true);
			goto('/settings');
		} catch (error) {
			console.error('Failed to verify code', error);
			toast.error('Failed to verify code. Please try again.');
		} finally {
			isVerifying = false;
		}
	}
</script>

<div class="flex h-screen items-center justify-center p-5">
	<div class="card flex w-full max-w-[470px] flex-col items-center space-y-5 p-5">
		{#if !verificationSent}
			<div class="text-3xl font-bold leading-none tracking-tight">Update phone number</div>
			<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] text-center opacity-80">
				We'll never send you spam. Receive only essential event notifications via SMS. Manage your
				preferences in general settings or individually for each bonfire.
			</div>
			<PhoneInput
				bind:value={phoneNumber}
				bind:country
				bind:valid={isPhoneNumberValid}
				options={{ autoPlaceholder: true }}
				class="w-full"
			/>
			<div class="flex w-full justify-center">
				<Button
					onclick={sendVerificationCode}
					class="mt-5 bg-green-500 hover:bg-green-400"
					disabled={!isPhoneNumberValid}
				>
					Send Verification Code
				</Button>
			</div>
		{:else}
			<div class="w-full text-center">
				<div class="text-3xl font-bold leading-none tracking-tight">Check your phone</div>
				<div class="text-muted-primary mx-auto mt-4 max-w-[32ch] opacity-80">
					We've sent you a verification code. Please enter it below.
				</div>
				<div class="mb-5 mt-8 flex w-full justify-center sm:text-2xl" id="otp-entry">
					<OTPRoot
						inputMode="numeric"
						ariaLabel="SMS verification code entry"
						maxLength={6}
						bind:value={verificationCodeInput}
						autoFocus={true}
						onComplete={verifyCode}
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
				<div class="flex w-full justify-center">
					<Button
						onclick={verifyCode}
						class="mt-5 bg-green-500 hover:bg-green-400"
						disabled={verificationCodeInput.length != 6}
					>
						Verify Code
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
