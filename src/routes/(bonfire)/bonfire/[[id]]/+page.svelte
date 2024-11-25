<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, ImagePlus } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';
	import { onMount } from 'svelte';
	import { Status } from '$lib/enums';
	import { ChevronRight } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { PUBLIC_ORIGIN } from '$env/static/public';
	import { KeyRound } from 'lucide-svelte';

	let userId = $state('');

	let event = $state();

	let rsvpStatus = $state('');

	let anonymousUser = $state(!$page.data.user);

	let client: TriplitClient;

	let profileImageMap = $page.data.profileImageMap;

	let attendeesGoing = $state([]);
	let attendeesMaybeGoing = $state([]);
	let attendeesNotGoing = $state([]);

	const showMaxNumPeople = 50;

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		(async () => {
			console.log('start');
			userId = (await waitForUserId()) as string;
			console.log('end');
		})();

		// Update event data based on the current page id
		event = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));

		const unsubscribeAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.where([['event_id', '=', $page.params.id]])
				.include('user')
				.build(),
			(results) => {
				// Separate attendees into different variables by status
				attendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				attendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				attendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);

				// Optionally log results for debugging
				// console.log('Going:', attendeesGoing);
				// console.log('Not Going:', attendeesNotGoing);
				// console.log('Maybe:', attendeesMaybeGoing);
			},
			(error) => {
				console.error('Error fetching attendees:', error);
			}
		);
	});

	let allAttendees = $derived([
		...(attendeesGoing || []),
		...(attendeesNotGoing || []),
		...(attendeesMaybeGoing || [])
	]);

	$effect(() => {
		// Ensure event data and userId are available
		if (allAttendees && userId) {
			// Find the current user's RSVP status in the attendees list
			const attendees = allAttendees;

			if (attendees && attendees.length > 0) {
				const currentUserAttendee = attendees.find((attendee) => attendee.user_id == userId);

				// Set RSVP status based on the attendee record, or keep it as default
				rsvpStatus = currentUserAttendee ? currentUserAttendee.status : undefined;
				$inspect('### rsvpStatus', rsvpStatus);
				// Group attendees by their RSVP status
			}
		}
	});
	function handleShare(eventData) {
		if (!navigator.share) {
			alert('Sharing is not supported on this browser.');
			return;
		}

		navigator
			.share({
				title: `Hey! You're invited to ${eventData.title}!`, // Use the event title
				text: `...Check out this awesome event at ${eventData.location}!`, // Use the event location
				url: `https://${PUBLIC_ORIGIN}/bonfire/${eventData.id}` // Use the event's unique ID in the URL
			})
			.then(() => {
				console.log('Content shared successfully!');
			})
			.catch((error) => {
				console.error('Error sharing content:', error);
			});
	}
</script>

{#if !event || event.fetching}
	<Loader />
{:else if event.error}
	<p>Error: {event.error.message}</p>
{:else if event.results}
	{console.log(event)}
	<div class="mx-4 flex flex-col items-center justify-center">
		<section class="mt-8 w-full sm:w-[450px]">
			{#if event.results[0].user_id == (userId as string)}
				<a class="flex w-full justify-center" href="update">
					<Button variant="outline" class="m-2 rounded-full">
						<Cog class="h-5 w-5" />
					</Button>
				</a>
			{/if}
			<h1 class="my-5 text-xl">{event.results[0].title}</h1>
			<div class="font-medium">{formatHumanReadable(event.results[0].start_time)}</div>
			<div class="font-light">{event.results[0].location}</div>
			<div class="mx-3 mt-5 items-center">
				{#if attendeesGoing.length > 0}
					<div class="flex flex-wrap items-center">
						<div class="-space-x-4">
							{#each attendeesGoing.slice(0, showMaxNumPeople) as attendee}
								<ProfileAvatar
									url={profileImageMap.get(attendee.user_id)?.small_image_url}
									fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
									username={attendee.user?.username}
									fallbackName={attendee.user?.username}
								/>
							{/each}
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap items-center -space-x-3">
						{#each Array(10).fill() as _, index}
							<Skeleton class="size-10 rounded-full" />
						{/each}
					</div>
				{/if}

				<Dialog.Root>
					<Dialog.Trigger class="flex"
						>{#if attendeesGoing.length > showMaxNumPeople}
							<div class="text-sm text-gray-500">
								and {attendeesGoing.length - showMaxNumPeople} more
							</div>
						{:else}
							see all
						{/if}<ChevronRight class="ml-1 h-4 w-4" /></Dialog.Trigger
					>
					<Dialog.Content class="h-full">
						<ScrollArea>
							<Dialog.Header>
								<Dialog.Title>Attendees</Dialog.Title>
								<Dialog.Description>
									<div class="mb-3 mt-5">
										{#if attendeesGoing.length > 0}
											<h2>Going</h2>
											<div class="mx-5 flex flex-wrap -space-x-4">
												{#each attendeesGoing as attendee}
													<ProfileAvatar
														url={profileImageMap.get(attendee.user_id)?.small_image_url}
														fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
														username={attendee.user?.username}
														fallbackName={attendee.user?.username}
													/>
												{/each}
											</div>
										{/if}
									</div>
									<div class="mb-3 mt-5">
										{#if attendeesMaybeGoing.length > 0}
											<h2>Maybe</h2>
											<div class="mx-5 flex flex-wrap -space-x-4">
												{#each attendeesMaybeGoing as attendee}
													<ProfileAvatar
														url={profileImageMap.get(attendee.user_id)?.small_image_url}
														fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
														username={attendee.user?.username}
														fallbackName={attendee.user?.username}
													/>
												{/each}
											</div>
										{/if}
									</div>
									<div class="mb-3 mt-5">
										{#if attendeesNotGoing.length > 0}
											<h2>Not Going</h2>
											<div class="mx-5 flex flex-wrap -space-x-4">
												{#each attendeesNotGoing as attendee}
													<ProfileAvatar
														url={profileImageMap.get(attendee.user_id)?.small_image_url}
														fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
														username={attendee.user?.username}
														fallbackName={attendee.user?.username}
													/>
												{/each}
											</div>
										{/if}
									</div>
								</Dialog.Description>
							</Dialog.Header>
						</ScrollArea>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			{#if anonymousUser}
				<a href="/login" class="mt-4 flex justify-center">
					<Button class="w-full bg-green-500 py-8 hover:bg-green-400">
						<KeyRound class="mr-2 size-4 " />
						Log in or register to interact with event.
					</Button>
				</a>
			{/if}
			<Rsvp {rsvpStatus} {userId} eventId={event.results[0].id} rsvpCanBeChanged={!anonymousUser} />

			<Button
				onclick={() => handleShare(event.results[0])}
				disabled={anonymousUser}
				class="mt-4 flex w-full items-center justify-center"
			>
				<Share class="h-5 w-5" />
				Share Bonfire</Button
			>
			<div class="my-10">
				{event.results[0].description}
			</div>
			{#if !anonymousUser}
				<hr class="my-10" />
				<div>
					<div class="my-10">
						<a href="media/add"
							><Button variant="outline" class="flex w-full items-center justify-center"
								><ImagePlus />Add to gallery</Button
							>
						</a>
						{#if $page.data.eventFiles}
							{console.log($page.data.eventFiles)}
							{#each $page.data.eventFiles as file}
								{file}
							{/each}
						{/if}
					</div>
					<div>Comments</div>
				</div>
			{/if}
		</section>
	</div>
{/if}
