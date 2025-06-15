<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Smile, Meh, Frown, HandMetal, LogOut } from 'lucide-svelte';
	import type { TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { getStrValueOfRSVP, Status, tempAttendeeSecretParam } from '$lib/enums';
	import AddToCalendar from '../AddToCalendar.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import PlusOneSelect from './PlusOneSelect.svelte';
	import UpdatePlusOneSelect from './UpdatePlusOneSelect.svelte';
	import {
		updateRSVPForLoggedInUser,
		updateRSVPForTempUser,
		checkIfTicketRequired
	} from '$lib/rsvp';
	import RsvpNameWithLoader from './RsvpNameWithLoader.svelte';
	import TicketPurchaseFlow from './TicketPurchaseFlow.svelte';

	let {
		rsvpStatus = Status.DEFAULT,
		userId,
		eventId,
		eventOwnerId,
		isAnonymousUser,
		rsvpCanBeChanged = true,
		maxNumGuestsAllowedPerAttendee = 0,
		numGuestsCurrentAttendeeIsBringing = 0,
		eventTitle,
		eventStartTime,
		eventEndTime = '',
		eventDescription = '',
		eventLocation = '',
		isDemo = false,
		isAdminMode = false,
		adminUpdateCallback = null,
		targetUserId = null,
		targetTempUserId = null
	} = $props();

	if (isDemo) {
		rsvpCanBeChanged = false;
	}

	let isAnonRsvpDialogOpen = $state(false);

	if (!rsvpStatus) {
		rsvpStatus = Status.DEFAULT;
	}

	let newRsvpStatusToSave: null | string = $state(null);
	let tempUserRsvpStatus: null | string = $state(null);
	let isPlusOneSelectDialogOpenForFullUser = $state(false);

	let isProcessingRsvp = $state(false);
	let showAddToCalendar = $state(false);
	let showTicketPurchaseFlow = $state(false);
	let ticketInfo = $state({
		isTicketed: false,
		hasTickets: false,
		ticketTypes: [],
		redirectToTickets: false
	});

	let client: TriplitClient;

	onMount(async () => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		// Check if this event requires tickets when component loads
		if (!isAnonymousUser && userId) {
			try {
				ticketInfo = await checkIfTicketRequired(eventId);
			} catch (error) {
				console.error('Error checking ticket requirements:', error);
			}
		}
	});

	let showAddToCalendarStatuses = new Set([Status.GOING, Status.MAYBE]);

	$effect(() => {
		showAddToCalendar = showAddToCalendarStatuses.has(rsvpStatus);
	});

	// Track dropdown state
	let dropdownOpen = $state(false);

	// Function to handle RSVP updates
	const updateRSVP = async (
		event: Event,
		oldValue: string | null,
		newValue: string | null,
		numGuestsCurrentAttendeeIsBringing: number | null = 0
	) => {
		if (isDemo) return;
		if (oldValue == newValue) {
			return;
		}
		if (!newValue) {
			newValue = rsvpStatus;
		}
		event.preventDefault();

		// Handle admin mode
		if (isAdminMode && adminUpdateCallback) {
			isProcessingRsvp = true;
			try {
				await adminUpdateCallback(newValue, numGuestsCurrentAttendeeIsBringing || 0);
				rsvpStatus = newValue; // Update local state
			} catch (error) {
				console.error('Admin RSVP update failed:', error);
			} finally {
				isProcessingRsvp = false;
				dropdownOpen = false;
			}
			return;
		}

		if (isAnonymousUser && newValue) {
			// Redirect to login page with RSVP data in URL
			const loginUrl = new URL('/login', window.location.origin);
			loginUrl.searchParams.set('eventId', eventId);
			loginUrl.searchParams.set('rsvpStatus', newValue);
			if (numGuestsCurrentAttendeeIsBringing && numGuestsCurrentAttendeeIsBringing > 0) {
				loginUrl.searchParams.set('numGuests', numGuestsCurrentAttendeeIsBringing.toString());
			}
			goto(loginUrl.pathname + loginUrl.search);
		} else if ($page.data.user) {
			// For GOING or MAYBE status, always check ticket requirements fresh
			if (newValue === Status.GOING || newValue === Status.MAYBE) {
				try {
					// Check ticket requirements every time for these statuses
					const freshTicketInfo = await checkIfTicketRequired(eventId);
					ticketInfo = freshTicketInfo; // Update cached info

					if (ticketInfo.isTicketed && !ticketInfo.hasTickets) {
						// Show ticket purchase flow instead of RSVP
						dropdownOpen = false;
						newRsvpStatusToSave = newValue; // Store the desired status
						showTicketPurchaseFlow = true;
						return;
					}
				} catch (error) {
					console.error('Error checking ticket requirements:', error);
					// Continue with RSVP if check fails (could be a free event)
				}
			}

			if (
				rsvpStatus == Status.DEFAULT &&
				!isPlusOneSelectDialogOpenForFullUser &&
				maxNumGuestsAllowedPerAttendee > 0 &&
				(!ticketInfo.isTicketed || ticketInfo.hasTickets) // Only show plus one if they have tickets or event is free
			) {
				// NOTE: updateRSVP will be called again from the opened dialog once the number of guests has been selected
				dropdownOpen = false;
				newRsvpStatusToSave = newValue;
				isPlusOneSelectDialogOpenForFullUser = true;
				return;
			}
			console.log('updating RSVP status for logged in user');
			isProcessingRsvp = true;
			await updateRSVPForLoggedInUser(
				client,
				userId,
				eventId,
				rsvpStatus,
				newValue as string,
				numGuestsCurrentAttendeeIsBringing
			);

			// TODO: this is a hack because when putting a going status, the attendee list does not update correctly,
			// not returning all attendees. Just reloading as that fixes the issue, though not ideal.
			if (rsvpStatus == Status.DEFAULT) {
				window.location.reload();
			}
		} else {
			console.log('updating RSVP status for temporary user');
			const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);

			if (!tempAttendeeSecret) {
				toast.error("You don't have a valid identity, please create a new one");
				return;
			}
			isProcessingRsvp = true;
			try {
				await updateRSVPForTempUser(
					newValue as string,
					eventId,
					tempAttendeeSecret,
					numGuestsCurrentAttendeeIsBringing
				);
				toast.success(`RSVP successfully updated to ${newValue}`);
			} catch (e) {
				console.error('Failed to update RSVP status:', newValue, e);
				toast.error('Sorry, we failed to update your RSVP status. Please try again later.');
			}
		}
		dropdownOpen = false;
		isProcessingRsvp = false;
		isPlusOneSelectDialogOpenForFullUser = false;
	};

	const leaveEvent = async (event: Event) => {
		isProcessingRsvp = true;
		try {
			await updateRSVP(event, rsvpStatus, Status.LEFT);
		} catch (e) {
			console.error(`failed to update RSVP to leaving for event ${eventId} and user ${userId}:`, e);
			toast.success(
				'This event has been unlinked from your account and removed from your dashboard.'
			);
		} finally {
			goto('/dashboard');
		}
	};
</script>

{#snippet rsvpButton()}
	<Button
		id="rsvp-btn"
		disabled={!rsvpCanBeChanged}
		variant="outline"
		class="flex w-full items-center justify-center {rsvpStatus === Status.GOING
			? 'bg-green-400 hover:bg-green-100 dark:bg-green-600 dark:hover:bg-green-500'
			: ''} {rsvpStatus === Status.MAYBE
			? 'bg-yellow-400 hover:bg-yellow-100 dark:bg-yellow-600 dark:hover:bg-yellow-500'
			: ''} {rsvpStatus === Status.NOT_GOING
			? 'bg-red-400 hover:bg-red-100 dark:bg-red-600 dark:hover:bg-red-500'
			: ''} {rsvpStatus === Status.DEFAULT
			? 'bg-purple-300 hover:bg-purple-100 dark:bg-purple-600 dark:hover:bg-purple-500'
			: ''}"
	>
		{#if rsvpStatus === Status.DEFAULT || rsvpStatus == null}
			<HandMetal class="mr-2" />
		{/if}
		{getStrValueOfRSVP(rsvpStatus)}
	</Button>
{/snippet}

<div class="mt-2 flex items-center space-x-1">
	{#if rsvpCanBeChanged}
		{#if rsvpStatus != Status.DEFAULT && maxNumGuestsAllowedPerAttendee > 0}
			<div>
				<UpdatePlusOneSelect
					{maxNumGuestsAllowedPerAttendee}
					bind:numGuests={numGuestsCurrentAttendeeIsBringing}
					updateCallback={(e: Event) => {
						updateRSVP(e, rsvpStatus, newRsvpStatusToSave, numGuestsCurrentAttendeeIsBringing);
					}}
				/>
			</div>
		{/if}
		<DropdownMenu.Root bind:open={dropdownOpen}>
			<DropdownMenu.Trigger class="rsvp-button w-full">
				{@render rsvpButton()}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="w-full">
				<DropdownMenu.Group>
					<DropdownMenu.Item
						id="rsvp-button-going"
						class={rsvpStatus === Status.GOING ? 'bg-green-400 dark:bg-green-600' : ''}
						onclick={(event) =>
							updateRSVP(event, rsvpStatus, Status.GOING, numGuestsCurrentAttendeeIsBringing)}
					>
						<RsvpNameWithLoader bind:isLoading={isProcessingRsvp}>
							<Smile class="mr-2" /> Going
						</RsvpNameWithLoader>
					</DropdownMenu.Item>
					<DropdownMenu.Item
						id="rsvp-button-maybe"
						class={rsvpStatus === Status.MAYBE ? 'bg-yellow-400 dark:bg-yellow-600' : ''}
						onclick={(event) =>
							updateRSVP(event, rsvpStatus, Status.MAYBE, numGuestsCurrentAttendeeIsBringing)}
					>
						<RsvpNameWithLoader bind:isLoading={isProcessingRsvp}>
							<Meh class="mr-2" /> Maybe
						</RsvpNameWithLoader>
					</DropdownMenu.Item>
					<DropdownMenu.Item
						id="rsvp-button-not-going"
						class={rsvpStatus === Status.NOT_GOING ? 'bg-red-400 dark:bg-red-600' : ''}
						onclick={(event) =>
							updateRSVP(event, rsvpStatus, Status.NOT_GOING, numGuestsCurrentAttendeeIsBringing)}
					>
						<RsvpNameWithLoader bind:isLoading={isProcessingRsvp}>
							<Frown class="mr-2" /> Not going
						</RsvpNameWithLoader>
					</DropdownMenu.Item>
					{#if rsvpStatus != Status.DEFAULT && userId && userId != eventOwnerId}
						<DropdownMenu.Item
							id="rsvp-button-leave"
							class={rsvpStatus === Status.NOT_GOING ? '' : ''}
							onclick={(event) => leaveEvent(event)}
						>
							<RsvpNameWithLoader bind:isLoading={isProcessingRsvp}>
								<LogOut class="mr-2" /> Leave event
							</RsvpNameWithLoader>
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		{#if showAddToCalendar}
			<span class="ml-1">
				<AddToCalendar
					title={eventTitle}
					start={eventStartTime}
					end={eventEndTime}
					description={eventDescription}
					location={eventLocation}
				/>
			</span>
		{/if}
	{:else}
		{@render rsvpButton()}
	{/if}
</div>

<!-- Ticket Purchase Flow Dialog -->
{#if showTicketPurchaseFlow}
	<TicketPurchaseFlow
		{eventId}
		ticketTypes={ticketInfo.ticketTypes}
		bind:open={showTicketPurchaseFlow}
		onTicketsPurchased={() => {
			// Refresh ticket info and allow RSVP
			checkIfTicketRequired(eventId).then((info) => {
				ticketInfo = info;
				showTicketPurchaseFlow = false;
				// Trigger RSVP after tickets are purchased
				if (newRsvpStatusToSave) {
					const statusToSave = newRsvpStatusToSave;
					newRsvpStatusToSave = null; // Clear the saved status
					updateRSVP(
						new Event('click'),
						rsvpStatus,
						statusToSave,
						numGuestsCurrentAttendeeIsBringing
					);
				}
			});
		}}
	/>
{/if}

<Dialog.Root bind:open={isPlusOneSelectDialogOpenForFullUser}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header class="flex w-full flex-col justify-center">
			<Dialog.Title>Are you bringing any guests?</Dialog.Title>
			<Dialog.Description>Let us know if you are, don't count yourself.</Dialog.Description>
		</Dialog.Header>

		<PlusOneSelect
			bind:numGuests={numGuestsCurrentAttendeeIsBringing}
			maxGuests={maxNumGuestsAllowedPerAttendee}
		/>
		<Button
			class="flex w-full items-center justify-between"
			onclick={(e) => {
				updateRSVP(e, rsvpStatus, newRsvpStatusToSave, numGuestsCurrentAttendeeIsBringing);
			}}
		>
			{#if isProcessingRsvp}
				<div class="loading loading-spinner loading-xs mr-2"></div>
			{:else}
				<div></div>
			{/if}
			Let's go!
			<div></div>
		</Button>
	</Dialog.Content>
</Dialog.Root>
