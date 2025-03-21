<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from './rsvp/Rsvp.svelte';
	import { parseColor } from '$lib/styles';
	import { goto } from '$app/navigation';
	import AttendeesCount from './attendance/AttendeesCount.svelte';

	let {
		event,
		userId,
		eventCreatorName,
		rsvpStatus,
		isPublished = true,
		numGuests = 0,
		attendeesStatuses,
		temporaryAttendeesStatuses,
		maxNumGuestsAllowedPerAttendee = 0
	} = $props();

	let rsvpCanBeChanged = new Date(event.start_time) >= new Date();
	let overlayColor = event.overlay_color ?? '#000000';
	let overlayOpacity = event.overlay_opacity ?? 0.5;

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

	const attendeesCount = countStatuses(attendeesStatuses);
	const temporaryAttendeesCount = countStatuses(temporaryAttendeesStatuses);

	const totalGoing = attendeesCount.going + temporaryAttendeesCount.going;
	const totalMaybe = attendeesCount.maybe + temporaryAttendeesCount.maybe;
	const totalNotGoing = attendeesCount.not_going + temporaryAttendeesCount.not_going;
</script>

<button
	onclick={() => goto(`/bonfire/${event.id}`)}
	class="event-card animate-fadeIn pointer-events-auto w-full cursor-pointer"
>
	<Card.Root class="relative my-4 w-full bg-slate-100 dark:bg-slate-900" style={event.style}>
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
				class="rounded-xl bg-slate-100 pb-2 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 sm:mb-4"
			>
				<Card.Title class="text-lg">{event.title}</Card.Title>
				<Card.Description>{formatHumanReadable(event.start_time)}</Card.Description>
				<Card.Description>Hosted by {eventCreatorName}</Card.Description>
			</Card.Header>
			<Card.Content>
				<AttendeesCount
					numAttendeesGoing={totalGoing}
					numAttendeesMaybeGoing={totalMaybe}
					numAttendeesNotGoing={totalNotGoing}
				/>
				<button
					class="interactive w-full md:max-w-96"
					onclick={(e) => {
						e.stopPropagation();
					}}
				>
					<Rsvp
						{rsvpStatus}
						{userId}
						eventId={event.id}
						{rsvpCanBeChanged}
						isAnonymousUser={false}
						numGuestsCurrentAttendeeIsBringing={numGuests}
						{maxNumGuestsAllowedPerAttendee}
						eventOwnerId={event.user_id}
					/>
				</button>
			</Card.Content>
			{#if event.user_id == (userId as string)}
				<a href={`/bonfire/${event.id}/update`}>
					<Button variant="outline" class="m-2 rounded-full">
						<Cog class="h-5 w-5" />
					</Button>
				</a>
			{/if}
		</div>
	</Card.Root>
</button>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
</style>
