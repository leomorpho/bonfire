<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, Plus, Drum, Copy } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';
	import { onMount } from 'svelte';
	import { Status, tempAttendeeIdStore, tempAttendeeIdUrlParam } from '$lib/enums';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { PUBLIC_ORIGIN } from '$env/static/public';
	import MiniGallery from '$lib/components/MiniGallery.svelte';
	import { toast } from 'svelte-sonner';
	import Annoucements from '$lib/components/Annoucements.svelte';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import EventDoesNotExist from '$lib/components/EventDoesNotExist.svelte';
	import CenterScreenMessage from '$lib/components/CenterScreenMessage.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { dev } from '$app/environment';

	let userId = $state('');

	let event = $state();
	let eventLoading = $state(true);
	let eventFailedLoading = $state(false);
	let fileCount = $state();
	let rsvpStatus = $state('');

	let isUnverifiedUser = $state($page.data.tempAttendeeExists);
	const tempAttendeeId = $page.url.searchParams.get(tempAttendeeIdUrlParam);
	let tempAttendee = $state(null);

	console.log('tempAttendeeId', tempAttendeeId);
	if ($page.data.tempAttendeeExists && tempAttendeeId) {
		isUnverifiedUser = true;
		tempAttendeeIdStore.set(tempAttendeeId);
	}

	let isAnonymousUser = $state(!$page.data.user);

	$effect(() => {
		if (isUnverifiedUser) {
			isAnonymousUser = false;
		}
	});

	$effect(() => {
		console.log(
			`isAnonymousUser: ${isAnonymousUser}, isUnverifiedUser: ${isUnverifiedUser}, $page.data.user: ${$page.data.user}`
		);
	});

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
	let attendeesLoading = $state(true);

	let tempAttendeesGoing: any = $state([]);
	let tempAttendeesMaybeGoing: any = $state([]);
	let tempAttendeesNotGoing: any = $state([]);
	let tempAttendeesLoading = $state(true);

	let currentUserAttendee = $state();
	const showMaxNumPeople = 50;

	const fetchProfileImageMap = async (userIds: string[]) => {
		try {
			loadingProfileImageMap = true;

			// Construct the query string with comma-separated user IDs
			let queryString = `userIds=${userIds.join(',')}`;
			if (isUnverifiedUser) {
				queryString = `${queryString}&${tempAttendeeIdUrlParam}=${tempAttendeeId}`;
			}
			const response = await fetch(`/profile/profile-images?${queryString}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch profileImageMap: ${response.statusText}`);
			}
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
			let url = `/bonfire/${eventId}/media/mini-gallery`;
			if (isUnverifiedUser) {
				url = `${url}?${tempAttendeeIdUrlParam}=${tempAttendeeId}`;
			}
			const response = await fetch(url);
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
		if (isAnonymousUser) {
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

		if (!isAnonymousUser) {
			(async () => {
				if (!isUnverifiedUser) {
					userId = (await waitForUserId()) as string;
				}

				// Fetch event files
				await fetchEventFiles($page.params.id);
			})();
		}

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
			},
			(error) => {
				console.error('Error fetching attendees:', error);
			}
		);

		const unsubscribeTempAttendeesQuery = client.subscribe(
			client
				.query('temporary_attendees')
				.where([['event_id', '=', $page.params.id]])
				.build(),
			(results) => {
				// // Separate attendees into different variables by status
				tempAttendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				tempAttendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				tempAttendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);
				// Fetch profile image map for attendees
				const userIds = results.map((attendee) => attendee.user_id);
				(async () => {
					await fetchProfileImageMap(userIds);
				})();
				tempAttendeesLoading = false;
			},
			(error) => {
				console.error('Error fetching attendees:', error);
			}
		);

		let unsubscribeTemporaryUserQuery = null;
		if (isUnverifiedUser) {
			unsubscribeTemporaryUserQuery = client.subscribe(
				client
					.query('temporary_attendees')
					.where([['id', '=', tempAttendeeId]])
					.build(),
				(results) => {
					if (results.length == 1) {
						tempAttendee = results[0];
						rsvpStatus = tempAttendee.status;
					}
				},
				(error) => {
					console.error('Error fetching temporary attendee:', error);
				}
			);
		}

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
			unsubscribeTempAttendeesQuery();
			if (unsubscribeTemporaryUserQuery) {
				unsubscribeTemporaryUserQuery();
			}
		};
	});

	let allAttendees = $derived([
		...(attendeesGoing || []),
		...(attendeesNotGoing || []),
		...(attendeesMaybeGoing || [])
	]);

	let allAttendeesGoing = $derived([...(attendeesGoing || []), ...(tempAttendeesGoing || [])]);
	let allAttendeesNotGoing = $derived([...(attendeesNotGoing || []), ...(tempAttendeesNotGoing || [])]);
	let allAttendeesMaybeGoing = $derived([...(attendeesMaybeGoing || []), ...(tempAttendeesMaybeGoing || [])]);

	$effect(() => {
		// Ensure event data and userId are available
		if ($page.data.user && allAttendees && userId) {
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

	const handleCopyingTempAccountUrl = async (eventData: any) => {
		// Prepare shareable data
		let url = '';
		if (dev) {
			url = `http://${PUBLIC_ORIGIN}/bonfire/${eventData.id}?${tempAttendeeIdUrlParam}=${tempAttendeeId}`;
		} else {
			url = `https://${PUBLIC_ORIGIN}/bonfire/${eventData.id}?${tempAttendeeIdUrlParam}=${tempAttendeeId}`;
		}

		// Add data to clipboard
		try {
			await navigator.clipboard.writeText(url);
			toast.success('URL copied to clipboard');
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			toast.success('Sorry, an error occurred, please try again later or contact support');
		}
	};
</script>

{#if !isAnonymousUser && !isUnverifiedUser && eventLoading}
	<Loader />
{:else if eventFailedLoading}
	<CenterScreenMessage
		message={'Oups, we apologize but the event failed to load, please try again later 😓'}
	/>
{:else if !eventLoading}
	{#if !event}
		<EventDoesNotExist />
	{:else}
		<div class="mx-4 flex flex-col items-center justify-center">
			<section class="mt-8 w-full sm:w-[450px] md:w-[550px] lg:w-[650px]">
				{#if isUnverifiedUser}
					<div
						class="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-gradient-to-r from-violet-200 to-pink-200 p-3"
					>
						{#if tempAttendee}
							<p class="font-semibold">Hi {tempAttendee.name}! This is a temporary account</p>
						{:else}
							<p class="font-semibold">Hi! This is a temporary account</p>
						{/if}
						<p class="text-sm">
							Leave this tab open to continue accessing it seamlessly, or click the below button to
							copy the URL and save it somewhere safe.
						</p>
						<p class="text-sm">
							This URL will allow you to access this event with your current temporary identity.
						</p>
						<Button
							onclick={() => handleCopyingTempAccountUrl(event)}
							class="mt-4 flex w-full items-center justify-center ring-glow"
						>
							<Copy class="h-5 w-5" />
							Copy Link</Button
						>
					</div>
				{/if}
				{#if !isAnonymousUser && !isUnverifiedUser && event.user_id == (userId as string)}
					<div class="flex w-full justify-center">
						<a href="update">
							<Button variant="outline" class="m-2 rounded-full">
								<Cog class="h-5 w-5" />
							</Button>
						</a>
					</div>
				{/if}
				<div class="rounded-xl bg-white p-5">
					<h1 class="text-xl">
						{isAnonymousUser ? $page.data.event.title : event.title}
					</h1>
					<div class="font-medium">{formatHumanReadable(event.start_time)}</div>
					<div class="font-light">
						{#if !isAnonymousUser}
							<div>{event.location}</div>
						{:else}
							Set RSVP status to see location
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
					{:else if !isAnonymousUser && attendeesGoing.length > 0}
						<div class="flex flex-wrap items-center -space-x-4">
							{#each allAttendeesGoing.slice(0, showMaxNumPeople) as attendee}
								<ProfileAvatar
									url={profileImageMap.get(attendee.user_id)?.small_image_url}
									fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
									username={attendee.user?.username || attendee.name}
									fallbackName={attendee.user?.username || attendee.name}
								/>
							{/each}
							<Dialog.Root>
								<Dialog.Trigger class="flex items-center"
									>{#if allAttendeesGoing.length > showMaxNumPeople}
										<div class="rounded-xl bg-white text-sm text-gray-500">
											and {allAttendeesGoing.length - showMaxNumPeople} more
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
													{#if allAttendeesGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Going</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each attendeesGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
																	username={attendee.user?.username || attendee.name}
																	fallbackName={attendee.user?.username || attendee.name}
																/>
															{/each}
														</div>
													{/if}
												</div>
												<div class="mb-3 mt-5">
													{#if allAttendeesMaybeGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Maybe</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each allAttendeesMaybeGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
																	username={attendee.user?.username || attendee.name}
																	fallbackName={attendee.user?.username || attendee.name}
																/>
															{/each}
														</div>
													{/if}
												</div>
												<div class="mb-3 mt-5">
													{#if allAttendeesNotGoing.length > 0}
														<h2 class="my-3 flex w-full justify-center font-semibold">Not Going</h2>
														<div class="mx-5 flex flex-wrap -space-x-4">
															{#each allAttendeesNotGoing as attendee}
																<ProfileAvatar
																	url={profileImageMap.get(attendee.user_id)?.small_image_url}
																	fullsizeUrl={profileImageMap.get(attendee.user_id)
																		?.full_image_url}
																	username={attendee.user?.username || attendee.name}
																	fallbackName={attendee.user?.username || attendee.name}
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
					{:else if !isAnonymousUser && allAttendeesGoing.length == 0}
						<div class="flex justify-center">
							<div
								class="flex w-full items-center justify-center rounded-lg bg-slate-500 bg-opacity-75 p-2 text-sm text-white ring-glow sm:w-2/3"
							>
								<Avatar.Root class="mr-2 h-12 w-12 border-2 border-white bg-white sm:h-14 sm:w-14">
									<Avatar.Image src={'/icon-128.png'} alt={''} />
									<Avatar.Fallback>{'BO'}</Avatar.Fallback>
								</Avatar.Root> No attendees yet
							</div>
						</div>
					{:else if isAnonymousUser}
						<div class="flex justify-center">
							<div
								class="flex w-full items-center justify-center rounded-lg bg-purple-500 bg-opacity-75 p-2 text-sm text-white ring-glow sm:w-2/3"
							>
								<Avatar.Root class="mr-2 h-12 w-12 border-2 border-white bg-white sm:h-14 sm:w-14">
									<Avatar.Image src={'/icon-128.png'} alt={''} />
									<Avatar.Fallback>{'BO'}</Avatar.Fallback>
								</Avatar.Root>
								{$page.data.numAttendees} attendees
							</div>
						</div>
					{/if}
				</div>
				<!-- {#if isAnonymousUser}
					<a href="/login" class="mt-4 flex justify-center">
						<Button class="w-full bg-green-500 py-8 hover:bg-green-400">
							<KeyRound class="mr-2 size-4 " />
							Log in or register to interact with event.
						</Button>
					</a>
				{/if} -->
				<Rsvp {rsvpStatus} {userId} eventId={event.id} {isAnonymousUser} />

				<Button
					onclick={() => handleShare(event)}
					class="mt-4 flex w-full items-center justify-center ring-glow"
				>
					<Share class="h-5 w-5" />
					Share Bonfire</Button
				>
				<div class="my-10 rounded-xl bg-white p-5">
					<div class="font-semibold">Details</div>
					{#if event.description}
						{event.description}
					{:else}
						{'No details yet...'}
					{/if}
				</div>
				<HorizRule />
				<div class="my-10">
					<div class=" rounded-xl bg-white p-5">
						<div class="font-semibold">Announcements</div>
					</div>
					{#if isAnonymousUser && $page.data.numAnnouncements != null}
						<div class="my-2">
							<BonfireNoInfoCard text={$page.data.numAnnouncements + ' announcements'} />
						</div>
					{:else}
						<div class="my-2">
							<Annoucements maxCount={3} {isUnverifiedUser} />
						</div>
						{#if event.user_id == userId}
							<a href="announcement/create">
								<Button class="mt-1 w-full ring-glow"
									><Drum class="mr-1 h-4 w-4" /> Create new announcement</Button
								>
							</a>
						{/if}
					{/if}
				</div>
				<HorizRule />
				<div class="my-5">
					<div class=" rounded-xl bg-white p-5">
						<div class="font-semibold">Gallery</div>
					</div>
					{#if (isAnonymousUser || isUnverifiedUser) && $page.data.numFiles != null}
						<div class="my-2">
							<BonfireNoInfoCard text={$page.data.numFiles + ' files'} />
						</div>
					{:else}
						<div class="mb-10">
							{#if eventFiles && fileCount.results}
								<MiniGallery
									fileCount={fileCount.results.length - eventFiles.length}
									{eventFiles}
								/>
							{:else if loadEventFiles}
								<Loader />
							{/if}
						</div>
					{/if}
				</div>
			</section>
		</div>
	{/if}
{/if}
