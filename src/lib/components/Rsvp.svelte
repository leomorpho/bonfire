<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Smile, Meh, Frown, HandMetal, LogOut } from 'lucide-svelte';
	import type { TriplitClient } from '@triplit/client';
	import { and } from '@triplit/client';
	import { getFeTriplitClient } from '$lib/triplit';
	import {
		getStrValueOfRSVP,
		NOTIFY_OF_ATTENDING_STATUS_CHANGE,
		Status,
		TEMP_ATTENDEE_MIN_NAME_LEN,
		tempAttendeeSecretParam,
		TempNameCheckingState
	} from '$lib/enums';
	import AddToCalendar from './AddToCalendar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { createNewAttendanceNotificationQueueObject } from '$lib/notification';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { debounce, generatePassphraseId } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';

	let {
		rsvpStatus = Status.DEFAULT,
		userId,
		eventId,
		isAnonymousUser,
		rsvpCanBeChanged = true
	} = $props();

	let isAnonRsvpDialogOpen = $state(false);

	if (!rsvpStatus) {
		rsvpStatus = Status.DEFAULT;
	}

	let tempRsvpStatus: null | string = $state(null);
	let tempName: null | string = $state(null);
	let tempMinNameLenReached = $state(false);
	let isNameAvailable = $state(false);
	let generateTempURLBtnEnabled: boolean = $state(false);
	let isGeneratingTempLink: boolean = $state(false);
	let loadingGeneratedTempLink: boolean = $state(false);
	let tempNameCheckingState: string | null = $state(null);

	$effect(() => {
		if (tempName && tempName.length >= TEMP_ATTENDEE_MIN_NAME_LEN) {
			tempMinNameLenReached = true;
		} else {
			tempMinNameLenReached = false;
		}
	});

	$effect(() => {
		if (tempMinNameLenReached && tempRsvpStatus && isNameAvailable) {
			generateTempURLBtnEnabled = true;
		} else {
			generateTempURLBtnEnabled = false;
		}
	});

	$effect(() => {
		console.log(tempNameCheckingState);
	});

	// console.log('attendance', attendance);
	console.log('userId', userId);
	console.log('eventId', eventId);

	let showAddToCalendar = $state(false);

	let client: TriplitClient;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
	});

	let showAddToCalendarStatuses = new Set([Status.GOING, Status.MAYBE]);

	$effect(() => {
		showAddToCalendar = showAddToCalendarStatuses.has(rsvpStatus);
	});

	// Track dropdown state
	let dropdownOpen = $state(false);

	// Function to handle RSVP updates
	const updateRSVP = async (event: Event, newValue: string) => {
		event.preventDefault();
		if (isAnonymousUser) {
			// Brand new temporary user, still an anonymous user at this point
			tempRsvpStatus = newValue;

			// Show modal to either
			// (a) log in with magic link and have that event be linked to their account right away
			// (b) enter a name and generate a unique link to access the event with their temporary identity
			isAnonRsvpDialogOpen = true;
		} else if ($page.data.user) {
			console.log('updating RSVP status for logged in user');
			await updateRSVPForLoggedInUser(newValue);
		} else {
			console.log('updating RSVP status for temporary user');
			await updateRSVPForTempUser(newValue);
		}
		dropdownOpen = false;
	};

	const deleteAttendance = async (event: Event) => {
		let attendance;

		try {
			const query = client
				.query('attendees')
				.where([
					and([
						['user_id', '=', userId],
						['event_id', '=', eventId as string]
					])
				])
				.select(['id'])
				.build();
			attendance = await client.fetchOne(query);
		} catch (e) {
			console.error(`failed to fetch attendance for event ${eventId} and user ${userId}:`, e);
		}

		if (!attendance) {
			console.error(
				`tried to delete attendance for event ${eventId} and user ${userId} but it does NOT exist`
			);
			return;
		}
		try {
			await client.delete('attendees', attendance.id);
			toast.success(
				'This event has been unlinked from your account and removed from your dashboard.'
			);
		} catch (e) {
			console.error(`failed to delete attendance for event ${eventId} and user ${userId}:`, e);
		} finally {
			goto('/dashboard');
		}
	};

	const checkNameAvailability = debounce(async function () {
		try {
			console.log('checking name availability');
			tempNameCheckingState = TempNameCheckingState.CHECKING;

			const response = await fetch(`/bonfire/${eventId}/temp/check-name`, {
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
			if (!tempRsvpStatus) {
				throw new Error('rsvp status is not set');
			}
			// Make a POST request to the backend endpoint
			const response = await fetch(`/bonfire/${eventId}/temp/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ id, eventId, status: tempRsvpStatus, name: tempName })
			});

			// Parse the response JSON
			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to create temporary attendee');
			}

			// Redirect if the attendee was created successfully
			if (result.success && result.redirectUrl) {
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

	const updateRSVPForTempUser = async (newValue: string) => {
		const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);

		if (!tempAttendeeSecret) {
			toast.error("You don't have a valid identity, please create a new one");
			return;
		}

		try {
			// Call the SvelteKit endpoint to update RSVP
			const response = await fetch(`/bonfire/${eventId}/temp/update-rsvp?${tempAttendeeSecretParam}=${tempAttendeeSecret}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tempAttendeeSecret,
					rsvpStatus: newValue
				})
			});

			if (!response.ok) {
				const errorMessage = await response.text();
				throw new Error(errorMessage || 'Failed to update RSVP status.');
			}

			// Update UI state or take further action if needed
			toast.success(`RSVP successfully updated to ${newValue}`);
			console.log('RSVP updated to:', newValue);
		} catch (error) {
			console.error('Failed to update RSVP status:', newValue, error);
			toast.error('Sorry, we failed to update your RSVP status. Please try again later.');
		}
	};

	const updateRSVPForLoggedInUser = async (newValue: string) => {
		try {
			const query = client
				.query('attendees')
				.where([
					and([
						['user_id', '=', userId],
						['event_id', '=', eventId as string]
					])
				])
				.build();
			let attendance = await client.fetchOne(query);

			console.log('user_id ---+', userId);
			console.log('event_id ---+', eventId);
			console.log('attendance ---+', attendance);

			if (!userId || !eventId) {
				console.error(
					`updateRSVPForLoggedInUser: userId (${userId}) or eventId (${eventId}) is missing and prevents update of RSVP status for logged in user`
				);
				return;
			}

			let attendanceId = attendance?.id;
			if (!attendance) {
				try {
					const { output } = await client.insert('attendees', {
						event_id: eventId,
						user_id: userId,
						status: newValue
					});
					attendanceId = output?.id;
				} catch (e) {
					console.error(
						`failed to create attendance for event ${eventId} and user ${userId}:`,
						newValue,
						e
					);
				}
			} else {
				try {
					attendance = await client.update('attendees', attendance.id, async (entity) => {
						entity.status = newValue;
					});
				} catch (e) {
					console.error('failed to update attendance:', newValue, e);
				}
			}

			// TODO: this is a hack because when putting a going status, the attendee list does not update correctly,
			// not returning all attendees. Just reloading as that fixes the issue, though not ideal.
			let reload = false;
			if (rsvpStatus == Status.DEFAULT) {
				reload = true;
			}
			rsvpStatus = newValue; // Update the label

			if (NOTIFY_OF_ATTENDING_STATUS_CHANGE.includes(rsvpStatus)) {
				try {
					await createNewAttendanceNotificationQueueObject(client, userId, eventId, [attendanceId]);
				} catch (e) {
					console.log('failed to create attendance notifications:', newValue, e);
				}
			}

			// Perform any additional actions, e.g., API call to save the new RSVP status
			console.log('RSVP updated to:', newValue);

			if (reload) {
				window.location.reload();
			}
		} catch (error) {
			console.log('failed to update RSVP status to:', newValue, error);
		}
	};
</script>

{#snippet rsvpButton()}
	<Button
		disabled={!rsvpCanBeChanged}
		variant="outline"
		class="mt-4 flex w-full items-center justify-center {rsvpStatus === Status.GOING
			? 'bg-green-400 hover:bg-green-100'
			: ''} {rsvpStatus === Status.MAYBE ? 'bg-yellow-400 hover:bg-yellow-100' : ''} {rsvpStatus ===
		Status.NOT_GOING
			? 'bg-red-400 hover:bg-red-100'
			: ''} {rsvpStatus === Status.DEFAULT ? 'bg-purple-300 hover:bg-purple-100' : ''}"
	>
		{#if rsvpStatus === Status.DEFAULT || rsvpStatus == null}
			<HandMetal class="mr-2" />
		{/if}
		{getStrValueOfRSVP(rsvpStatus)}
	</Button>
{/snippet}

<div class="flex">
	{#if rsvpCanBeChanged}
		<DropdownMenu.Root bind:open={dropdownOpen}>
			<DropdownMenu.Trigger class="w-full" id="rsvp-button">
				{@render rsvpButton()}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-full">
				<DropdownMenu.Group>
					<DropdownMenu.Item
						class={rsvpStatus === Status.GOING ? 'bg-green-400' : ''}
						onclick={(event) => updateRSVP(event, Status.GOING)}
					>
						<Smile /> Going
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class={rsvpStatus === Status.MAYBE ? 'bg-yellow-400' : ''}
						onclick={(event) => updateRSVP(event, Status.MAYBE)}
					>
						<Meh /> Maybe
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class={rsvpStatus === Status.NOT_GOING ? 'bg-red-400' : ''}
						onclick={(event) => updateRSVP(event, Status.NOT_GOING)}
					>
						<Frown /> Not going
					</DropdownMenu.Item>
					{#if rsvpStatus != Status.DEFAULT}
						<DropdownMenu.Item
							class={rsvpStatus === Status.NOT_GOING ? '' : ''}
							onclick={(event) => deleteAttendance(event)}
						>
							<LogOut /> Leave event
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		{#if showAddToCalendar}
			<span class="ml-1"> <AddToCalendar /> </span>
		{/if}
	{:else}
		{@render rsvpButton()}
	{/if}
</div>

<Dialog.Root bind:open={isAnonRsvpDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Hey There!</Dialog.Title>
			<Dialog.Description>There are two ways to set your RSVP status.</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			<a href={`/login/?event_id=${eventId}`}>
				<Button class="w-full bg-green-500 text-lg">Register/Login</Button>
			</a>
		</div>

		<div class="inline-flex w-full items-center justify-center">
			<hr class="my-8 h-px w-64 border-0 bg-gray-200 dark:bg-gray-700" />
			<span
				class="absolute left-1/2 -translate-x-1/2 bg-white px-3 font-medium text-gray-900 dark:bg-gray-900 dark:text-white"
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

		<div class="mb-2 mt-3 grid grid-cols-4 items-center gap-4">
			<Label for="username" class="text-right">Name</Label>
			<Input
				oninput={checkNameAvailability}
				bind:value={tempName}
				id="username"
				placeholder="Tony Garfunkel"
				class="col-span-3"
			/>
		</div>
		<div class="mb-4 flex w-full justify-center">
			<ul class="list-disc space-y-2 pl-6 text-xs text-yellow-400">
				{#if tempName && !tempMinNameLenReached}
					<li>At least {TEMP_ATTENDEE_MIN_NAME_LEN} characters</li>
				{/if}
				{#if tempNameCheckingState === TempNameCheckingState.NAME_TAKEN}
					<li>This name is already taken by someone in this event</li>
				{/if}
			</ul>
		</div>
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
