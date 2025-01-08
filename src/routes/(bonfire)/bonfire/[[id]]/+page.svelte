<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, Plus, Drum } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';
	import { onMount } from 'svelte';
	import { Status } from '$lib/enums';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { PUBLIC_ORIGIN } from '$env/static/public';
	import { KeyRound } from 'lucide-svelte';
	import MiniGallery from '$lib/components/MiniGallery.svelte';
	import { toast } from 'svelte-sonner';
	import Annoucements from '$lib/components/Annoucements.svelte';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import EventDoesNotExist from '$lib/components/EventDoesNotExist.svelte';
	import CenterScreenMessage from '$lib/components/CenterScreenMessage.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let userId = $state('');

	let event = $state();
	let eventLoading = $state(true);
	let eventFailedLoading = $state(false);
	let fileCount = $state();
	let rsvpStatus = $state('');
	let anonymousUser = $state(!$page.data.user);

	let client: TriplitClient;

	let profileImageMap: Map<string, { full_image_url: string; small_image_url: string }> = $state(
		new Map()
	);
	let loadingProfileImageMap = $state(false);

	let eventFiles: any[] = $state([]);
	let loadEventFiles = $state(true);

	let attendeesGoing: any = $state([]);
	let attendeesMaybeGoing: any = $state([]);
	let attendeesNotGoing: any = $state([]);
	let attendeesLoading = $state(false);

	let currentUserAttendee = $state();
	const showMaxNumPeople = 50;

	const fetchProfileImageMap = async (userIds: string[]) => {
		try {
			loadingProfileImageMap = true;
			const response = await fetch(
				`/profile/profile-images?${userIds.map((id) => `userIds=${id}`).join('&')}`
			);
			if (!response.ok) throw new Error(`Failed to fetch profileImageMap: ${response.statusText}`);

			// Transform the fetched data into a Map
			const fetchedData: Record<string, { full_image_url: string; small_image_url: string }> =
				await response.json();
			profileImageMap = new Map(
				Object.entries(fetchedData) // Convert the plain object into Map entries
			);
		} catch (error) {
			console.error('Error fetching profile image map:', error);
		} finally {
			loadingProfileImageMap = false;
		}
	};

	const fetchEventFiles = async (eventId: string) => {
		try {
			loadEventFiles = true;
			const response = await fetch(`/bonfire/${eventId}/media/mini-gallery`);
			if (!response.ok) throw new Error(`Failed to fetch eventFiles: ${response.statusText}`);
			eventFiles = await response.json();
		} catch (error) {
			console.error('Error fetching event files:', error);
		} finally {
			loadEventFiles = false;
		}
	};

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;
		if (anonymousUser) {
			// If user is anonymous, load event data from page data. It will contain limited data.
			event = $page.data.event;
			eventLoading = false;
			attendeesLoading = false;
			return;
		}

		eventLoading = true;
		// Update event data based on the current page id
		const unsubscribeFromEventQuery = client.subscribe(
			client
				.query('events')
				.where([['id', '=', $page.params.id]])
				.build(),
			(results) => {
				console.log('results', results);
				if (results.length == 1) {
					event = results[0];
				}
				eventLoading = false;
			},
			(error) => {
				console.error('Error fetching event:', error);
				eventFailedLoading = true;
			}
		);

		(async () => {
			userId = (await waitForUserId()) as string;
			// Fetch event files
			await fetchEventFiles($page.params.id);
		})();

		fileCount = useQuery(
			client,
			client.query('files').where(['event_id', '=', $page.params.id]).select(['id'])
		);

		const unsubscribeAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.where([['event_id', '=', $page.params.id]])
				.include('user')
				.build(),
			(results) => {
				console.log('number users: ', results.length);
				// Separate attendees into different variables by status
				attendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				attendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				attendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);
				// Fetch profile image map for attendees
				const userIds = results.map((attendee) => attendee.user_id);
				(async () => {
					await fetchProfileImageMap(userIds);
				})();
				attendeesLoading = false;

				// Optionally log results for debugging
				// console.log('Going:', attendeesGoing);
				// console.log('Not Going:', attendeesNotGoing);
				// console.log('Maybe:', attendeesMaybeGoing);
			},
			(error) => {
				console.error('Error fetching attendees:', error);
			}
		);

		// Get the hash portion of the URL
		const hash = window.location.hash.slice(1); // Remove the '#' from the hash
		if (hash) {
			const observer = new MutationObserver(() => {
				const section = document.getElementById(hash);
				if (section) {
					section.scrollIntoView({ behavior: 'smooth' });
					observer.disconnect(); // Stop observing once the section is found
				}
			});

			// Observe changes in the entire body or a specific container
			observer.observe(document.body, { childList: true, subtree: true });
		}

		return () => {
			// Cleanup
			unsubscribeAttendeesQuery();
			unsubscribeFromEventQuery();
		};
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
				currentUserAttendee = attendees.find((attendee) => attendee.user_id == userId);

				// Set RSVP status based on the attendee record, or keep it as default
				rsvpStatus = currentUserAttendee ? currentUserAttendee.status : undefined;
				$inspect('### rsvpStatus', rsvpStatus);
				// Group attendees by their RSVP status
			}
		}
	});

	const handleShare = async (eventData: any) => {
		if (!navigator.share) {
			alert('Sharing is not supported on this browser.');
			return;
		}

		// Prepare shareable data
		const shareData = {
			title: `Hey! You're invited to ${eventData.title}!`, // Use the event title
			text: `...Check out this awesome event at ${eventData.location}!`, // Use the event location
			url: `https://${PUBLIC_ORIGIN}/bonfire/${eventData.id}` // Use the event's unique ID in the URL
		};

		toast.success('Invitation copied to clipboard!');

		// Add data to clipboard
		try {
			const clipboardText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
			await navigator.clipboard.writeText(clipboardText);
		} catch (error) {
			console.error('Error copying to clipboard:', error);
		}

		navigator
			.share(shareData)
			.then(() => {
				console.log('Content shared successfully!');
			})
			.catch((error) => {
				console.error('Error sharing content:', error);
			});
	};
</script>

{#if !anonymousUser && eventLoading}
	<Loader />
{:else if eventFailedLoading}
	<CenterScreenMessage
		message={'Oups, we apologize but the event failed to load, please try again later 😓'}
	/>
{:else if !eventLoading}
	{#if anonymousUser && !event}
		<EventDoesNotExist />
	{:else}
		{console.log('--> event', event)}
		<div class="mx-4 flex flex-col items-center justify-center">
			<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
				{#if !anonymousUser && event.user_id == (userId as string)}
					<div class="flex w-full justify-center">
						<a href="update">
							<Button variant="outline" class="m-2 rounded-full">
								<Cog class="h-5 w-5" />
							</Button>
						</a>
					</div>
				{/if}
				<div class="rounded-xl bg-white p-5">
					<h1 class="text-xl">{anonymousUser ? $page.data.event.title : event.title}</h1>
					<div class="font-medium">{formatHumanReadable(event.start_time)}</div>
					<div class="font-light">
						{#if !anonymousUser}
							<div>{event.location}</div>
						{:else}
							Please log in to see location
						{/if}
					</div>
				</div>

				<div class="mx-3 mt-5 items-center">
					{#if attendeesLoading}
						<div class="flex flex-wrap items-center -space-x-3">
							{#each Array(20).fill() as _, index}
								<Skeleton class="size-12 rounded-full" />
							{/each}
						</div>
					{:else if attendeesGoing.length > 0}
						<div class="flex flex-wrap items-center -space-x-4">
							{#each attendeesGoing.slice(0, showMaxNumPeople) as attendee}
								<ProfileAvatar
									url={profileImageMap.get(attendee.user_id)?.small_image_url}
									fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
									username={attendee.user?.username}
									fallbackName={attendee.user?.username}
								/>
							{/each}
							<Dialog.Root>
								<Dialog.Trigger class="flex items-center"
									>{#if attendeesGoing.length > showMaxNumPeople}
										<div class="rounded-xl bg-white text-sm text-gray-500">
											and {attendeesGoing.length - showMaxNumPeople} more
										</div>
									{/if}
									<div class="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
										<Plus class="ml-1 h-4 w-4 rounded-xl bg-white sm:h-5 sm:w-5" />
									</div></Dialog.Trigger
								>
								<Dialog.Content class="h-full">
									<ScrollArea>
										<Dialog.Header>
											<Dialog.Title class="flex w-full justify-center">Attendees</Dialog.Title>
											<Dialog.Description>
												<div class="mb-3 mt-5">
													{#if attendeesGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Going</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each attendeesGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
																	username={attendee.user?.username}
																	fallbackName={attendee.user?.username}
																/>
															{/each}
														</div>
													{/if}
												</div>
												<div class="mb-3 mt-5">
													{#if attendeesMaybeGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Maybe</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each attendeesMaybeGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
																	username={attendee.user?.username}
																	fallbackName={attendee.user?.username}
																/>
															{/each}
														</div>
													{/if}
												</div>
												<div class="mb-3 mt-5">
													{#if attendeesNotGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Not Going</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each attendeesNotGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
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
					{:else if attendeesGoing.length == 0}
						<div class="flex justify-center">
							<div class="flex w-full sm:w-2/3 justify-center items-center rounded-lg bg-purple-500 p-2 text-sm text-white ring-glow">
								<Avatar.Root class="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white mr-2 bg-white">
									<Avatar.Image src={"/icon-128.png"} alt={""} />
									<Avatar.Fallback>{"BO"}</Avatar.Fallback>
								</Avatar.Root> No attendees yet
							</div>
						</div>
					{:else if anonymousUser}{/if}
				</div>
				{#if anonymousUser}
					<a href="/login" class="mt-4 flex justify-center">
						<Button class="w-full bg-green-500 py-8 hover:bg-green-400">
							<KeyRound class="mr-2 size-4 " />
							Log in or register to interact with event.
						</Button>
					</a>
				{/if}
				<Rsvp {rsvpStatus} {userId} eventId={event.id} isAnonymousUser={anonymousUser} />

				<Button
					onclick={() => handleShare(event)}
					disabled={anonymousUser}
					class="mt-4 flex w-full items-center justify-center ring-glow"
				>
					<Share class="h-5 w-5" />
					Share Bonfire</Button
				>
				<div class="my-10 rounded-xl bg-white p-5">
					<div class="font-semibold">Details</div>
					{event.description}
				</div>
				{#if !anonymousUser}
					<HorizRule />
					<div class="my-10">
						<div class="rounded-xl bg-white p-5 font-semibold" id="announcements">
							Announcements
						</div>
						<div class="my-2">
							<Annoucements maxCount={3} />
						</div>
						{#if event.user_id == userId}
							<a href="announcement/create">
								<Button class="mt-1 w-full ring-glow"
									><Drum class="mr-1 h-4 w-4" /> Create new announcement</Button
								>
							</a>
						{/if}
					</div>
					<HorizRule />

					<div class="my-10">
						{#if eventFiles && fileCount.results}
							<MiniGallery fileCount={fileCount.results.length - eventFiles.length} {eventFiles} />
						{:else if loadEventFiles}
							<Loader />
						{/if}
					</div>
				{/if}
			</section>
		</div>
	{/if}
{/if}
