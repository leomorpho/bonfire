<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from './rsvp/Rsvp.svelte';
	import { parseColor } from '$lib/styles';
	import { goto } from '$app/navigation';
	import AttendeesCount from './attendance/AttendeesCount.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import type { FontSelection } from '$lib/types';
	import EditEventButton from './main-bonfire-event/EditEventButton.svelte';
	import { browser } from '$app/environment';
	import { fetchBannerInfo } from '$lib/gallery';

	let {
		eventId,
		eventTitle,
		eventDescription,
		eventStartTime,
		eventEndTime,
		eventLocation,
		eventCreatorId,
		overlayColor = '#000000',
		overlayOpacity = 0.5,
		style = '',
		fontStr = null,
		eventCreatorName,
		currUserId = null,
		rsvpStatus = null,
		isPublished = true,
		numGuests = 0,
		maxNumGuestsAllowedPerAttendee = 0,
		isDemo = false,
		bannerImageUrl = ''
	} = $props();

	let rsvpCanBeChanged = new Date(eventStartTime) >= new Date();
	let font: FontSelection | null = fontStr ? JSON.parse(fontStr) : null;
	let bannerInfo = $state();

	if (browser && font && font.cdn) {
		const fontLink = document.createElement('link');
		fontLink.href = font.cdn;
		fontLink.rel = 'stylesheet';
		document.head.appendChild(fontLink);
	}

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});`
	);

	function countStatuses(statusesArray: any) {
		return statusesArray.reduce(
			(acc, statusObj) => {
				const status = statusObj.status;
				const guestCount = statusObj.guest_count || 0;
				if (status in acc) {
					acc[status] += 1 + guestCount;
				} else {
					acc[status] = 1 + guestCount;
				}
				return acc;
			},
			{ going: 0, maybe: 0, not_going: 0 }
		);
	}

	let attendeesCount = $state(0);
	let temporaryAttendeesCount = $state(0);

	let totalGoing = $state();
	let totalMaybe = $state();
	let totalNotGoing = $state();

	$effect(() => {
		if (attendeesCount && temporaryAttendeesCount) {
			totalGoing = attendeesCount.going + temporaryAttendeesCount.going;
			totalMaybe = attendeesCount.maybe + temporaryAttendeesCount.maybe;
			totalNotGoing = attendeesCount.not_going + temporaryAttendeesCount.not_going;
		}
	});

	onMount(() => {
		if (!currUserId) return;

		const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribeFromEventAttendees = client.subscribe(
			client.query('attendees').Where(['event_id', '=', eventId]).Select(['status', 'guest_count']),
			(results) => {
				const attendeesStatuses = results;
				attendeesCount = countStatuses(attendeesStatuses);

				console.log('attendeesCount', attendeesCount);
			},
			(error) => {
				console.error('Error fetching current attendees:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		const unsubscribeFromEventTemporaryAttendees = client.subscribe(
			client
				.query('temporary_attendees')
				.Where(['event_id', '=', eventId])
				.Select(['status', 'guest_count']),
			(results) => {
				const temporaryAttendeesStatuses = results;
				temporaryAttendeesCount = countStatuses(temporaryAttendeesStatuses);
			},
			(error) => {
				console.error('Error fetching current attendees:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		bannerInfo = fetchBannerInfo(eventId, null);

		return () => {
			// Cleanup
			unsubscribeFromEventAttendees();
			unsubscribeFromEventTemporaryAttendees();
		};
	});
</script>

<button
	onclick={() => {
		if (isDemo) return;
		goto(`/bonfire/${eventId}`);
	}}
	class="event-card animate-fadeIn pointer-events-auto w-full cursor-pointer duration-300 animate-in fade-in"
>
	<Card.Root class="relative my-4 w-full bg-slate-200 dark:bg-slate-900" {style}>
		<!-- Not Published Marker -->
		{#if !isPublished}
			<div
				class="absolute right-2 top-2 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md dark:bg-red-500"
			>
				Not Published
			</div>
		{/if}
		<!-- Overlay -->
		<div style={overlayStyle} class="pointer-events-none absolute inset-0 rounded-xl"></div>

		<!-- Content -->
		<div class="relative z-10 p-4">
			<Card.Header
				class="min-h-32 rounded-xl bg-slate-200 bg-cover bg-center pb-2 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 sm:mb-4"
				style={`background-image: url('${bannerImageUrl}');`}
			>
				<div class="flex w-full justify-center">
					<Card.Title
						style={font?.style}
						class="w-fit rounded-lg bg-slate-200/80 px-2 py-1 text-2xl dark:bg-slate-800/80 md:text-3xl "
					>
						{eventTitle}
					</Card.Title>
				</div>
				<div class="flex w-full justify-center">
					<Card.Description
						class="w-fit rounded-lg bg-slate-200/80 px-1 text-sm dark:bg-slate-800/80"
					>
						{formatHumanReadable(eventStartTime)}
					</Card.Description>
				</div>
				<div class="flex w-full justify-center">
					<Card.Description
						class="w-fit rounded-lg bg-slate-200/80 px-1 text-sm dark:bg-slate-800/80"
					>
						Hosted by {eventCreatorName}
					</Card.Description>
				</div>
			</Card.Header>
			<Card.Content>
				{#if totalGoing || totalMaybe || totalNotGoing}
					<AttendeesCount
						numAttendeesGoing={totalGoing}
						numAttendeesMaybeGoing={totalMaybe}
						numAttendeesNotGoing={totalNotGoing}
					/>
				{/if}
				<button
					class="interactive w-full md:max-w-96"
					onclick={(e) => {
						e.stopPropagation();
					}}
				>
					<Rsvp
						{rsvpStatus}
						userId={currUserId}
						{eventId}
						{rsvpCanBeChanged}
						isAnonymousUser={false}
						numGuestsCurrentAttendeeIsBringing={numGuests}
						{maxNumGuestsAllowedPerAttendee}
						eventOwnerId={eventCreatorId}
						{eventTitle}
						{eventStartTime}
						{eventEndTime}
						{eventDescription}
						{eventLocation}
						{isDemo}
					/>
				</button>
			</Card.Content>
			{#if currUserId && eventCreatorId == (currUserId as string)}
				<EditEventButton
					url={`/bonfire/${eventId}/update`}
					eventIsPublished={isPublished}
					class="rounded-full bg-slate-200 p-2 transition-all duration-200 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-700"
				/>
			{/if}
		</div>
	</Card.Root>
</button>
