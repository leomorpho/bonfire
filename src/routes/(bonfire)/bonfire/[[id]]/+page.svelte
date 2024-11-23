<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, ImagePlus } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';
	import { onMount } from 'svelte';
	import { GOING, MAYBE, NOT_GOING } from '$lib/enums';
	import { and } from '@triplit/client';
	import { ChevronRight } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	let userId = $state('');

	let event = $state();

	let rsvpStatus = $state();

	let anonymousUser = $state(!$page.data.user);

	let client = feTriplitClient as TriplitClient;

	let profileImageMap = $page.data.profileImageMap;

	let attendeesGoing = $state([]);
	let attendeesMaybeGoing = $state([]);
	let attendeesNotGoing = $state([]);

	let unsubscribeGoing;
	let unsubscribeMaybe;
	let unsubscribeNot;

	onMount(() => {
		(async () => {
			console.log('start');
			userId = (await waitForUserId()) as string;
			console.log('end');
		})();

		// Update event data based on the current page id
		event = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));

		// Subscribe to "going" attendees
		unsubscribeGoing = client.subscribe(
			client
				.query('attendees')
				.where([
					and([
						['status', '=', GOING],
						['event_id', '=', $page.params.id]
					])
				])
				.include('user')
				.build(),
			(results) => {
				attendeesGoing = results;
				console.log('# attendeesGoing', attendeesGoing);
			},
			(error) => {
				console.error('Error fetching "going" attendees:', error);
			}
		);

		// Subscribe to "not going" attendees
		unsubscribeNot = client.subscribe(
			client
				.query('attendees')
				.where([
					and([
						['status', '=', NOT_GOING],
						['event_id', '=', $page.params.id]
					])
				])
				.include('user')
				.build(),
			(results) => {
				attendeesNotGoing = results;
			},
			(error) => {
				console.error('Error fetching "going" attendees:', error);
			}
		);

		// Subscribe to "maybe" attendees
		unsubscribeMaybe = client.subscribe(
			client
				.query('attendees')
				.where([
					and([
						['status', '=', MAYBE],
						['event_id', '=', $page.params.id]
					])
				])
				.include('user')
				.build(),
			(results) => {
				attendeesMaybeGoing = results;
			},
			(error) => {
				console.error('Error fetching "going" attendees:', error);
			}
		);
	});

	$effect(() => {
		// Ensure event data and userId are available
		if (event.results && event.results.length > 0 && userId) {
			// Find the current user's RSVP status in the attendees list
			const attendees = event.results[0].attendees;

			if (attendees && attendees.length > 0) {
				const currentUserAttendee = attendees.find((attendee) => attendee.user_id === userId);

				// Set RSVP status based on the attendee record, or keep it as default
				rsvpStatus = currentUserAttendee ? currentUserAttendee : undefined;

				// Group attendees by their RSVP status
			} else {
				console.log('No attendees yet.');
			}
		}
	});
</script>

{#if !event || event.fetching}
	<Loader />
{:else if event.error}
	<p>Error: {event.error.message}</p>
{:else if event.results}
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
			<div class="mt-5 flex flex-row flex-wrap items-center">
				{#if attendeesGoing.length > 0}
					<div class="flex flex-wrap -space-x-4">
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
				<Dialog.Root>
					<Dialog.Trigger><ChevronRight class="ml-1 h-4 w-4" /></Dialog.Trigger>
					<Dialog.Content>
						<ScrollArea class="h-screen">
							<Dialog.Header>
								<Dialog.Title>Attendees</Dialog.Title>
								<Dialog.Description>
									<div class="mb-3 mt-5">
										{#if attendeesGoing.length > 0}
											<h2>Going</h2>
											<div class="flex flex-wrap -space-x-4">
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
											<div class="flex flex-wrap -space-x-4">
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
											<div class="flex flex-wrap -space-x-4">
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
				<div class="mt-4 flex justify-center text-yellow-600">
					Log in or register to interact with event.
				</div>
			{/if}
			<Rsvp
				attendance={rsvpStatus}
				{userId}
				eventId={event.results[0].id}
				rsvpCanBeChanged={!anonymousUser}
			/>

			<Button disabled={anonymousUser} class="mt-4 flex w-full items-center justify-center">
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
					</div>
					<div>Comments</div>
				</div>
			{/if}
		</section>
	</div>
{/if}
