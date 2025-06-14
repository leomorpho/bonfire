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
	import { isStartDateBeforeCutoff } from '$lib/rsvp';
	import { fontStore } from '$lib/styles';
	import { EventStatus } from '$lib/enums';

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
		bannerImageUrl = '',
		numGoingAttendees = null,
		maxCapacity = null,
		isCuttoffDateEnabled = false,
		cuttoffDate = null,
		eventStatus = EventStatus.ACTIVE
	} = $props();

	let isCurrentDateBeforeCutoff = $state(
		isStartDateBeforeCutoff(isCuttoffDateEnabled, cuttoffDate)
	);

	// $effect(() => {
	// 	console.log(
	// 		'isCurrentDateBeforeCutoff',
	// 		isCurrentDateBeforeCutoff,
	// 		'new Date(eventStartTime) >= new Date()',
	// 		new Date(eventStartTime) >= new Date(),
	// 		'rsvpEnabledForCapacity',
	// 		rsvpEnabledForCapacity,
	// 		'eventStartTime',
	// 		eventStartTime,
	// 		'cuttoffDate',
	// 		cuttoffDate
	// 	);
	// });

	let rsvpEnabledForCapacity = $derived(
		!(numGoingAttendees && maxCapacity) ||
			(numGoingAttendees && maxCapacity && numGoingAttendees < maxCapacity)
			? true
			: false
	);

	let eventIsInFuture = $state(new Date(eventStartTime) >= new Date());

	let rsvpCanBeChanged = $derived(
		eventIsInFuture && isCurrentDateBeforeCutoff && rsvpEnabledForCapacity
	);
	let font: FontSelection | null = fontStr ? JSON.parse(fontStr) : null;
	let bannerInfo = $state();
	let cardStyleElement: HTMLStyleElement | null = null;

	// Apply font and font scaling for this specific event card
	function applyEventCardStyles(font: FontSelection | null) {
		if (!browser) return;

		const cardId = `event-card-${eventId}`;
		const styleElementId = `${cardId}-style`;

		// Remove existing styles
		const existingStyle = document.getElementById(styleElementId);
		if (existingStyle && document.head.contains(existingStyle)) {
			document.head.removeChild(existingStyle);
		}

		if (!font) return;

		// Add font CDN if available
		if (font.cdn) {
			const fontLink = document.createElement('link');
			fontLink.href = font.cdn;
			fontLink.rel = 'stylesheet';
			document.head.appendChild(fontLink);
		}

		// Generate scoped font scaling CSS for this specific card
		const fontSize = font.fontSize || 1.0;
		const fontStyle = font.style || '';

		const tailwindTextSizes = {
			'text-xs': '0.75rem',
			'text-sm': '0.875rem',
			'text-base': '1rem',
			'text-lg': '1.125rem',
			'text-xl': '1.25rem',
			'text-2xl': '1.5rem',
			'text-3xl': '1.875rem',
			'text-4xl': '2.25rem',
			'text-5xl': '3rem',
			'text-6xl': '3.75rem',
			'text-7xl': '4.5rem',
			'text-8xl': '6rem',
			'text-9xl': '8rem'
		};

		const scaleRules = Object.entries(tailwindTextSizes)
			.map(
				([className, size]) =>
					`.${cardId} .${className} { font-size: calc(${size} * ${fontSize}); }`
			)
			.join('\n');

		const baseRule = `.${cardId} { font-size: calc(1rem * ${fontSize}); ${fontStyle} }`;

		const completeCss = `${baseRule}\n${scaleRules}`;

		cardStyleElement = document.createElement('style');
		cardStyleElement.id = styleElementId;
		cardStyleElement.type = 'text/css';
		cardStyleElement.textContent = completeCss;
		document.head.appendChild(cardStyleElement);
	}

	// Apply styles when component mounts or fontStore changes
	onMount(() => {
		applyEventCardStyles(font);

		// Subscribe to fontStore changes for global font updates
		const unsubscribe = fontStore.subscribe((globalFont) => {
			// If this card doesn't have its own font, use the global font
			if (!font && globalFont) {
				applyEventCardStyles(globalFont);
			}
		});

		return () => {
			// Cleanup on unmount
			unsubscribe();
			if (cardStyleElement && document.head.contains(cardStyleElement)) {
				document.head.removeChild(cardStyleElement);
			}
		};
	});

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity}); z-index: 10;`
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
	<Card.Root
		class="relative my-4 w-full bg-slate-200 dark:bg-slate-900 event-card-{eventId}"
		{style}
	>
		<!-- Event Status Markers -->
		{#if eventStatus === EventStatus.CANCELLED}
			<div
				class="absolute right-2 top-2 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md dark:bg-red-500"
			>
				CANCELLED
			</div>
		{:else if !isPublished}
			<div
				class="absolute right-2 top-2 z-20 rounded bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-md dark:bg-orange-500"
			>
				DRAFT
			</div>
		{/if}
		<!-- Overlay -->
		<div style={overlayStyle} class="pointer-events-none absolute inset-0 rounded-xl"></div>

		<!-- Content -->
		<div class="relative z-10 p-4">
			<Card.Header
				class="banner relative min-h-32 rounded-xl bg-cover bg-center pb-2 sm:mb-4"
				style={`background-image: url('${bannerImageUrl}'); ${overlayStyle};`}
			>
				<div
					class="pointer-events-none absolute inset-0 z-10 rounded-xl bg-white/70 dark:bg-slate-800/70"
				></div>

				<div class="flex w-full justify-center">
					<Card.Title
						style={font?.style}
						class="z-20 w-fit rounded-lg px-2 py-1 text-2xl text-black dark:text-white sm:text-3xl lg:text-4xl"
					>
						{eventTitle}
					</Card.Title>
				</div>
				<div class="flex w-full justify-center">
					<Card.Description class="z-20 w-fit rounded-lg px-1 text-sm text-black dark:text-white">
						{formatHumanReadable(eventStartTime)}
					</Card.Description>
				</div>
				<div class="flex w-full justify-center">
					<Card.Description class="z-20 w-fit rounded-lg px-1 text-sm text-black dark:text-white">
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
				{#if !isCurrentDateBeforeCutoff || eventIsInFuture || rsvpEnabledForCapacity}
					<div class="flex w-full flex-wrap justify-center">
						{#if !isCurrentDateBeforeCutoff}
							{@render warning('cutoff passed')}
						{/if}
						{#if !eventIsInFuture}
							{@render warning('event over')}
						{/if}
						{#if !rsvpEnabledForCapacity}
							{@render warning('full capacity')}
						{/if}
					</div>
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

{#snippet warning(text: string)}
	<div class="mx-2 my-1 rounded-full bg-red-400/70 px-2 text-sm">{text}</div>
{/snippet}
