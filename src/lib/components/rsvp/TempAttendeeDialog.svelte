<script lang="ts">
	import { TEMP_ATTENDEE_MIN_NAME_LEN, TempNameCheckingState } from '$lib/enums';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { debounce, generatePassphraseId } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import PlusOneSelect from './PlusOneSelect.svelte';
	import type { TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let {
		isAnonRsvpDialogOpen = $bindable<boolean>(),
		tempUserRsvpStatus = $bindable<string>(),
		eventId
	} = $props();

	let tempName: null | string = $state(null);
	let tempMinNameLenReached = $state(false);
	let isGeneratingTempLink: boolean = $state(false);
	let loadingGeneratedTempLink: boolean = $state(false);
	let tempNameCheckingState: string | null = $state(null);
	let generateTempURLBtnEnabled: boolean = $state(false);
	let isNameAvailable: boolean = $state(false);
	let numExtraGuests: number = $state(0);

	let isNameLongEnough = $derived(tempName && tempMinNameLenReached);
	let isNameAlreadyTaken = $derived(tempNameCheckingState === TempNameCheckingState.NAME_TAKEN);

	let client: TriplitClient;

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
	});

	$effect(() => {
		if (tempName && tempName.length >= TEMP_ATTENDEE_MIN_NAME_LEN) {
			tempMinNameLenReached = true;
		} else {
			tempMinNameLenReached = false;
		}
	});

	$effect(() => {
		if (tempMinNameLenReached && tempUserRsvpStatus && isNameAvailable) {
			generateTempURLBtnEnabled = true;
		} else {
			generateTempURLBtnEnabled = false;
		}
	});

	const checkNameAvailability = debounce(async function () {
		try {
			console.log('checking name availability');
			tempNameCheckingState = TempNameCheckingState.CHECKING;

			const response = await fetch(`/bonfire/${eventId}/attend/temp-user/check-name`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: tempName })
			});

			const result = await response.json();

			if (!response.ok) {
				// Handle 409 Conflict (Name already taken)
				if (response.status === 409) {
					tempNameCheckingState = TempNameCheckingState.NAME_TAKEN;
					isNameAvailable = false;
					return;
				}

				// Handle other errors
				tempNameCheckingState = TempNameCheckingState.ERROR;
			} else {
				// Success (Name is available)
				isNameAvailable = true;
				tempNameCheckingState = TempNameCheckingState.AVAILABLE;
				return result;
			}
		} catch (error) {
			console.error('Error checking name availability:', error.message || error);
			throw error;
		}
	}, 250); // Debounce delay is set to 500ms

	const createTemporaryAttendee = async () => {
		isGeneratingTempLink = true;
		const id = await generatePassphraseId('u', 36);
		try {
			if (!tempUserRsvpStatus) {
				throw new Error('rsvp status is not set');
			}
			// Make a POST request to the backend endpoint
			const response = await fetch(`/bonfire/${eventId}/attend/temp-user/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					id,
					eventId,
					status: tempUserRsvpStatus,
					name: tempName,
					numExtraGuests: numExtraGuests
				})
			});

			// Parse the response JSON
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to create temporary attendee');
			}

			// Redirect if the attendee was created successfully
			if (result.success && result.redirectUrl) {
				client.endSession();
				window.location.href = result.redirectUrl;
			} else {
				throw new Error('Unexpected response from the server');
			}
		} catch (error) {
			console.error('Error creating temporary attendee:', error);
			toast.error('Sorry, an error occurred while creating your attendee, please try again later');
		} finally {
			isGeneratingTempLink = false;
			loadingGeneratedTempLink = true;
		}
	};
</script>

<Dialog.Root bind:open={isAnonRsvpDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Hey There!</Dialog.Title>
			<Dialog.Description>There are two ways to set your RSVP status.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			<a href={`/login/?event_id=${eventId}`}>
				<Button class="w-full bg-green-500 text-lg hover:bg-green-400">Register/Login</Button>
			</a>
		</div>

		<div class="inline-flex w-full items-center justify-center">
			<hr class="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
			<span
				class="absolute left-1/2 -translate-x-1/2 rounded-lg bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white"
				>or</span
			>
		</div>
		<div class="mb-2 text-lg">Generate unique URL</div>
		<div class="text-sm text-slate-500">
			<p>
				A unique URL that connects your actions to this event. Keep it open in a tab or save it for
				future access—don’t lose it! This link serves as your identity for this event.
			</p>
		</div>

		<div class="mt-3 grid grid-cols-4 items-center gap-4">
			<Label for="username" class="text-right">Name</Label>
			<Input
				oninput={checkNameAvailability}
				bind:value={tempName}
				id="username"
				placeholder="Tony Garfunkel"
				class="col-span-3"
			/>
		</div>
		{#if tempName && (!isNameLongEnough || isNameAlreadyTaken)}
			<div class="my-4 flex w-full justify-center">
				<ul class="list-disc space-y-2 pl-6 text-xs text-yellow-400">
					{#if !isNameLongEnough}
						<li>At least {TEMP_ATTENDEE_MIN_NAME_LEN} characters</li>
					{/if}
					{#if isNameAlreadyTaken}
						<li>This name is already taken by someone in this event</li>
					{/if}
				</ul>
			</div>
		{/if}
		<PlusOneSelect bind:numGuests={numExtraGuests} />
		<Button
			type="submit"
			class="w-full"
			onclick={createTemporaryAttendee}
			disabled={!generateTempURLBtnEnabled}
		>
			{#if isGeneratingTempLink}
				<div class="flex items-center justify-between">
					<div>Generating...</div>
					<span class="loading loading-spinner loading-xs ml-2"> </span>
				</div>
			{:else if tempNameCheckingState === TempNameCheckingState.CHECKING}
				<div class="flex items-center justify-between">
					<div>Checking name availability...</div>
					<span class="loading loading-spinner loading-xs ml-2"> </span>
				</div>
			{:else if loadingGeneratedTempLink}
				<div class="flex items-center justify-between">
					<div>Loading...</div>
					<span class="loading loading-spinner loading-xs ml-2"> </span>
				</div>
			{:else}
				Generate URL
			{/if}
		</Button>
	</Dialog.Content>
</Dialog.Root>
