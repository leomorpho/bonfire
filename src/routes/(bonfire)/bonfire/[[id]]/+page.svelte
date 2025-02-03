<script lang="ts">
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Cog,
		Share,
		Plus,
		Drum,
		Copy,
		MapPin,
		UserRound,
		Calendar,
		KeyRound,
		ArrowRightFromLine
	} from 'lucide-svelte';
	import { formatHumanReadable, formatHumanReadableHour } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';
	import { onMount } from 'svelte';
	import { Status, tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import MiniGallery from '$lib/components/MiniGallery.svelte';
	import { toast } from 'svelte-sonner';
	import Annoucements from '$lib/components/Annoucements.svelte';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import EventDoesNotExist from '$lib/components/EventDoesNotExist.svelte';
	import CenterScreenMessage from '$lib/components/CenterScreenMessage.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { overlayColorStore, overlayOpacityStore, styleStore } from '$lib/styles';
	import ShareLocation from '$lib/components/ShareLocation.svelte';
	import type { EventTypescriptType } from '$lib/types';
	import BonfireBanner from '$lib/components/BonfireBanner.svelte';
	import { env as publicEnv } from '$env/dynamic/public';

	let currUserId = $state('');

	$effect(() => {
		if ($page.data.user) {
			currUserId = $page.data.user.id;
		}
	});

	let event = $state<EventTypescriptType>();
	let eventLoading = $state(true);
	let eventFailedLoading = $state(false);
	let fileCount = $state(0);
	let rsvpStatus = $state('');

	const tempAttendeeId = $page.data.tempAttendeeId;
	let isUnverifiedUser = $derived(!!tempAttendeeId);

	const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);
	let tempAttendee = $state(null);
	let rsvpCanBeChanged = $state(false);

	$effect(() => {
		if (event) {
			rsvpCanBeChanged = new Date(event.start_time) >= new Date();
		}
	});

	$effect(() => {
		console.log('==== rsvpStatus', rsvpStatus);
	});

	if (tempAttendeeId) {
		tempAttendeeSecretStore.set(tempAttendeeId);
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
	let tempAttendeesLoading = $state(true);

	let tempAttendeesGoing: any = $state([]);
	let tempAttendeesMaybeGoing: any = $state([]);
	let tempAttendeesNotGoing: any = $state([]);

	let currentUserAttendee = $state();
	const showMaxNumPeople = 50;

	let currenUserIsEventAdmin = $state(false);

	let latitude = $state(null);
	let longitude = $state(null);

	let adminUserIds = $state(new Set<string>());

	$effect(() => {
		if (
			(event && currUserId && event.user_id == (currUserId as string)) ||
			adminUserIds.has(currUserId)
		) {
			currenUserIsEventAdmin = true;
		}
	});

	const convertGeocodedLocationToLatLon = (eventGeocodedLocation: any) => {
		// console.log('###### eventGeocodedLocation -->', eventGeocodedLocation);
		if (eventGeocodedLocation.latitude && eventGeocodedLocation.longitude) {
			latitude = eventGeocodedLocation.latitude;
			longitude = eventGeocodedLocation.longitude;
		}
		if (eventGeocodedLocation.data.latitude && eventGeocodedLocation.data.longitude) {
			latitude = eventGeocodedLocation.data.latitude;
			longitude = eventGeocodedLocation.data.longitude;
		}
	};

	const fetchProfileImageMap = async (userIds: string[]) => {
		// TODO: we can make this more performant by passing a last queried at timestamp (UTC) and the server will only returned changed users (added/updated/deleted images)
		// This function never removes any profile pic entry, only upserts them.
		try {
			loadingProfileImageMap = true;

			// Construct the query string with comma-separated user IDs
			let queryString = `userIds=${userIds.join(',')}`;
			if (isUnverifiedUser) {
				queryString = `${queryString}&${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
			}
			const response = await fetch(`/profile/profile-images?${queryString}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch profileImageMap: ${response.statusText}`);
			}

			// Transform the fetched data into a plain object
			const fetchedData: Record<string, { full_image_url: string; small_image_url: string }> =
				await response.json();

			// Update the existing profileImageMap without removing old entries
			if (!profileImageMap) {
				profileImageMap = new Map(); // Initialize if not already a Map
			}
			for (const [key, value] of Object.entries(fetchedData)) {
				profileImageMap.set(key, value); // Update or add new entries
			}
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
				url = `${url}?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
			}
			const response = await fetch(url);
			if (!response.ok) throw new Error(`Failed to fetch eventFiles: ${response.statusText}`);
			eventFiles = await response.json();
			console.log('eventFiles', eventFiles);
		} catch (error) {
			console.error('Error fetching event files:', error);
		} finally {
			loadEventFiles = false;
		}
	};

	const orderAttendeesByProfileImage = (attendees, profileImageMap) => {
		return attendees.sort((a, b) => {
			const hasImageA = profileImageMap.has(a.user_id);
			const hasImageB = profileImageMap.has(b.user_id);

			if (hasImageA && !hasImageB) {
				return -1;
			} else if (!hasImageA && hasImageB) {
				return 1;
			} else {
				return 0;
			}
		});
	};

	const placeAttendeesWithProfilePicAtFrontOfLists = (
		attendeesGoing: any,
		attendeesNotGoing: any,
		attendeesMaybeGoing: any,
		profileImageMap: any
	) => {
		attendeesGoing = orderAttendeesByProfileImage(attendeesGoing, profileImageMap);
		attendeesNotGoing = orderAttendeesByProfileImage(attendeesNotGoing, profileImageMap);
		attendeesMaybeGoing = orderAttendeesByProfileImage(attendeesMaybeGoing, profileImageMap);
	};

	onMount(() => {
		client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		// TODO: below can be squashed into the above unsubscribeTempAttendeesQuery
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
						rsvpStatus = tempAttendee?.status;
					}
				},
				(error) => {
					console.error('Error fetching current temporary attendee:', error);
				}
			);
		}

		console.log('$page.data ===> $page.data', $page.data);
		if (
			(isAnonymousUser || !$page.data.isUserAnAttendee) &&
			$page.data.event.user_id != currUserId
		) {
			// If user is anonymous, load event data from page data. It will contain limited data.
			// Also, if the user is logged in but is NOT YET attending, we don't want to pull live data
			// since they won't have the permissions to.
			console.log(
				'not fetching event data because user is anonymous or not an attendee, and therefore only data returned from BE will be shown'
			);
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
				.include('banner_media')
				.include('event_admins')
				.subquery(
					'organizer',
					client.query('user').where(['id', '=', '$1.user_id']).select(['username', 'id']).build(),
					'one'
				)
				.build(),
			(results) => {
				if (results.length == 1) {
					event = results[0];
					// console.log('EVENT', event);
					if (event) {
						if (event.geocoded_location) {
							try {
								convertGeocodedLocationToLatLon(JSON.parse(event.geocoded_location as string));
							} catch (e) {
								console.log(e);
							}
						}
						styleStore.set(event.style);
						overlayColorStore.set(event.overlay_color);
						overlayOpacityStore.set(event.overlay_opacity);
						eventLoading = false;

						if (event.event_admins) {
							adminUserIds = new Set(
								event.event_admins.map((admin: { user_id: string }) => admin.user_id)
							);
						}
					}
				}
			},
			(error) => {
				console.error('Error fetching event:', error);
				eventFailedLoading = true;
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					eventLoading = false;
				}
			}
		);

		if (!isAnonymousUser && !isUnverifiedUser) {
			(async () => {
				currUserId = (await waitForUserId()) as string;

				// Fetch event files
				await fetchEventFiles($page.params.id);
			})();
		}

		const unsubscribeAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.where([['event_id', '=', $page.params.id]])
				.include('user')
				.build(),
			(results) => {
				console.log('attendees', results);
				// Separate attendees into different variables by status
				attendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				attendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				attendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);

				// Fetch profile image map for attendees
				const userIds = results.map((attendee) => attendee.user_id);
				(async () => {
					await fetchProfileImageMap(userIds);
					placeAttendeesWithProfilePicAtFrontOfLists(
						attendeesGoing,
						attendeesNotGoing,
						attendeesMaybeGoing,
						profileImageMap
					);
				})();
				attendeesLoading = false;
				console.log('results', results);
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

		const unsubscribeFromFilesQuery = client.subscribe(
			client
				.query('files')
				.where([['event_id', '=', $page.params.id]])
				.select(['id'])
				.build(),
			(results) => {
				// If there are less than 3 files in the events eventFiles, fetch the latest 3
				(async () => {
					await fetchEventFiles($page.params.id);
				})();
				fileCount = results.length;
			},
			(error) => {
				console.error('Error fetching files:', error);
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
			unsubscribeTempAttendeesQuery();
			if (unsubscribeTemporaryUserQuery) {
				unsubscribeTemporaryUserQuery();
			}
			unsubscribeFromFilesQuery();
		};
	});

	let allAttendees = $derived([
		...(attendeesGoing || []),
		...(attendeesNotGoing || []),
		...(attendeesMaybeGoing || [])
	]);

	let allAttendeesGoing = $derived([...(attendeesGoing || []), ...(tempAttendeesGoing || [])]);
	let allAttendeesNotGoing = $derived([
		...(attendeesNotGoing || []),
		...(tempAttendeesNotGoing || [])
	]);
	let allAttendeesMaybeGoing = $derived([
		...(attendeesMaybeGoing || []),
		...(tempAttendeesMaybeGoing || [])
	]);

	$effect(() => {
		// Ensure event data and currUserId are available
		if ($page.data.user && allAttendees && currUserId) {
			// Find the current user's RSVP status in the attendees list
			const attendees = allAttendees;

			if (attendees && attendees.length > 0) {
				currentUserAttendee = attendees.find((attendee) => attendee.user_id == currUserId);
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
			url: `${publicEnv.PUBLIC_ORIGIN}/bonfire/${eventData.id}` // Use the event's unique ID in the URL
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
		let url = `${publicEnv.PUBLIC_ORIGIN}/bonfire/${eventData.id}?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;

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
				<!-- TODO: allow temp attendees to delete themselves -->
				{#if isUnverifiedUser}
					<div
						class="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-gradient-to-r from-violet-200 to-pink-200 p-5 text-center"
					>
						{#if tempAttendee}
							<p class="font-semibold">Hi {tempAttendee.name}! This is a temporary account</p>
						{:else}
							<p class="font-semibold">Hi! This is a temporary account</p>
						{/if}
						<p class="text-sm">
							Keep this tab open for seamless access, or click the button below to copy the URL and
							save it.
						</p>
						<p class="text-sm">This URL grants access to the event with your temporary identity.</p>
						<p class="text-sm">Sign up anytime to link your events to your email.</p>
						<a href="/login" class="w-full">
							<Button
								class="mt-4 flex w-full items-center justify-center bg-blue-500 hover:bg-blue-400"
							>
								<KeyRound class="h-5 w-5" />
								Sign Up or Log In</Button
							>
						</a>
						<Button
							onclick={() => handleCopyingTempAccountUrl(event)}
							class="mt-4 flex w-full items-center justify-center"
						>
							<Copy class="h-5 w-5" />
							Copy Link</Button
						>
					</div>
				{/if}
				{#if currenUserIsEventAdmin}
					<div class="flex w-full justify-center">
						<a href="update" id="edit-bonfire">
							<Button variant="outline" class="m-2 rounded-full">
								<Cog class="h-5 w-5" />
							</Button>
						</a>
					</div>
				{/if}
				<div class="space-y-3 rounded-xl bg-white p-5 dark:bg-slate-900">
					{#if $page.data.bannerInfo && $page.data.bannerInfo.banneIsSet}
						<div class="flex w-full justify-center">
							<BonfireBanner
								blurhash={$page.data.bannerInfo.bannerBlurHash}
								bannerSmallSizeUrl={$page.data.bannerInfo.bannerSmallSizeUrl}
								bannerLargeSizeUrl={$page.data.bannerInfo.bannerLargeSizeUrl}
								{currenUserIsEventAdmin}
							/>
						</div>
					{:else if currenUserIsEventAdmin}
						<a class="flex w-full" href="banner/upload">
							<Button class="w-full dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
								>Set a banner image</Button
							>
						</a>
					{/if}
					<h1 class="mb-4 flex justify-center text-xl sm:text-2xl">
						{event.title}
					</h1>
					<div class="flex items-center justify-center font-medium">
						<Calendar class="mr-2 h-4 w-4" />{formatHumanReadable(event.start_time)}
						{#if event.end_time}to {formatHumanReadableHour(event.end_time)}{/if}
					</div>
					<div class="flex items-center justify-center font-light">
						{#if event.organizer}
							<UserRound class="mr-2 h-4 w-4" />Hosted by
							{#if rsvpStatus}
								<div class="ml-2">
									<ProfileAvatar
										url={profileImageMap.get(event.organizer['id'])?.small_image_url}
										fullsizeUrl={profileImageMap.get(event.organizer['id'])?.full_image_url}
										username={event.organizer['username']}
										fallbackName={event.organizer['username']}
										isTempUser={false}
										lastUpdatedAt=""
									/>
								</div>
							{:else}
								{event.organizer['username']}
							{/if}
						{/if}
					</div>

					<div class="flex items-center justify-center font-light">
						<MapPin class="mr-2 h-4 w-4" />
						{#if rsvpStatus}
							{#if event.location}<div class="flex items-center justify-center">
									{#if latitude && longitude}
										<ShareLocation lat={latitude} lon={longitude}>
											<div
												id="share-location"
												class="flex items-center justify-center rounded-xl bg-slate-100 p-2 dark:bg-slate-900"
											>
												{@html event.location}
												<ArrowRightFromLine class="ml-2 h-4 w-4" />
											</div>
										</ShareLocation>
									{:else}
										<div class="flex items-center justify-center p-2">{event.location}</div>
									{/if}
								</div>
							{:else}
								<div>No location set</div>
							{/if}
						{:else}
							Set RSVP status to see location
						{/if}
					</div>
					<div
						class="my-5 flex flex-col justify-center rounded-xl bg-slate-100 p-2 text-center dark:bg-slate-800"
					>
						<div class="font-semibold">Details</div>
						{#if event.description}
							{event.description}
						{:else}
							{'No details yet...'}
						{/if}
					</div>
				</div>

				<div class="mx-3 mt-5 items-center">
					{#if attendeesLoading}
						<div class="flex flex-wrap items-center -space-x-3">
							{#each Array(20).fill(null) as _, index}
								<Skeleton class="size-12 rounded-full" />
							{/each}
						</div>
					{:else if rsvpStatus}
						{#if attendeesGoing.length > 0}
							<div id="going-attendees" class="flex flex-wrap items-center -space-x-4">
								{#each allAttendeesGoing.slice(0, showMaxNumPeople) as attendee}
									<ProfileAvatar
										url={profileImageMap.get(attendee.user_id)?.small_image_url}
										fullsizeUrl={profileImageMap.get(attendee.user_id)?.full_image_url}
										username={attendee.user?.username || attendee.name}
										fallbackName={attendee.user?.username || attendee.name}
										isTempUser={!!attendee.name}
										lastUpdatedAt={attendee.updated_at}
										viewerIsEventAdmin={currenUserIsEventAdmin}
										attendanceId={attendee.id}
									/>
								{/each}
								<Dialog.Root>
									<Dialog.Trigger class="flex items-center"
										>{#if allAttendeesGoing.length > showMaxNumPeople}
											<div
												class="rounded-xl bg-white text-sm text-gray-500 dark:bg-slate-900 dark:text-gray-100"
											>
												and {allAttendeesGoing.length - showMaxNumPeople} more
											</div>
										{/if}
										<div class="flex h-12 w-12 items-center justify-center sm:h-14 sm:w-14">
											<Plus
												class="ml-1 h-4 w-4 rounded-xl bg-white dark:bg-slate-900 sm:h-5 sm:w-5"
											/>
										</div></Dialog.Trigger
									>
									<Dialog.Content class="h-full sm:h-[90vh]">
										<ScrollArea>
											<Dialog.Header>
												<Dialog.Title class="flex w-full justify-center">Attendees</Dialog.Title>
												<Dialog.Description>
													<div class="mb-3 mt-5">
														{#if allAttendeesGoing.length > 0}
															{console.log('---> attendeesGoing', attendeesGoing)}
															<h2 class="my-3 flex w-full justify-center font-semibold">Going</h2>
															<div class="mx-5 flex flex-wrap -space-x-4 text-black">
																{#each allAttendeesGoing as attendee}
																	<ProfileAvatar
																		url={profileImageMap.get(attendee.user_id)?.small_image_url}
																		fullsizeUrl={profileImageMap.get(attendee.user_id)
																			?.full_image_url}
																		username={attendee.user?.username || attendee.name}
																		fallbackName={attendee.user?.username || attendee.name}
																		isTempUser={!!attendee.name}
																		lastUpdatedAt={attendee.updated_at}
																		viewerIsEventAdmin={currenUserIsEventAdmin}
																		attendanceId={attendee.id}
																	/>
																{/each}
															</div>
														{/if}
													</div>
													<div class="mb-3 mt-5">
														{#if allAttendeesMaybeGoing.length > 0}
															<h2 class="my-3 flex w-full justify-center font-semibold">Maybe</h2>
															<div class="mx-5 flex flex-wrap -space-x-4 text-black">
																{#each allAttendeesMaybeGoing as attendee}
																	<ProfileAvatar
																		url={profileImageMap.get(attendee.user_id)?.small_image_url}
																		fullsizeUrl={profileImageMap.get(attendee.user_id)
																			?.full_image_url}
																		username={attendee.user?.username || attendee.name}
																		fallbackName={attendee.user?.username || attendee.name}
																		isTempUser={!!attendee.name}
																		lastUpdatedAt={attendee.updated_at}
																		viewerIsEventAdmin={currenUserIsEventAdmin}
																		attendanceId={attendee.id}
																	/>
																{/each}
															</div>
														{/if}
													</div>
													<div class="mb-3 mt-5">
														{#if allAttendeesNotGoing.length > 0}
															<h2 class="my-3 flex w-full justify-center font-semibold">
																Not Going
															</h2>
															<div class="mx-5 flex flex-wrap -space-x-4 text-black">
																{#each allAttendeesNotGoing as attendee}
																	<ProfileAvatar
																		url={profileImageMap.get(attendee.user_id)?.small_image_url}
																		fullsizeUrl={profileImageMap.get(attendee.user_id)
																			?.full_image_url}
																		username={attendee.user?.username || attendee.name}
																		fallbackName={attendee.user?.username || attendee.name}
																		isTempUser={!!attendee.name}
																		lastUpdatedAt={attendee.updated_at}
																		viewerIsEventAdmin={currenUserIsEventAdmin}
																		attendanceId={attendee.id}
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
						{:else if allAttendeesGoing.length == 0}
							<div class="flex justify-center">
								<div
									class="flex w-full items-center justify-center rounded-lg bg-slate-500 bg-opacity-75 p-2 text-sm text-white ring-glow sm:w-2/3"
								>
									<Avatar.Root
										class="mr-2 h-12 w-12 border-2 border-white bg-white dark:bg-slate-900 sm:h-14 sm:w-14"
									>
										<Avatar.Image src={'/icon-128.png'} alt={''} />
										<Avatar.Fallback>{'BO'}</Avatar.Fallback>
									</Avatar.Root> No attendees yet
								</div>
							</div>
						{/if}
					{:else}
						<div class="flex justify-center">
							<div
								class="flex w-full items-center justify-center rounded-lg bg-purple-500 bg-opacity-75 p-2 text-sm text-white ring-glow sm:w-2/3"
							>
								<Avatar.Root
									class="mr-2 h-12 w-12 border-2 border-white bg-white dark:bg-slate-900 sm:h-14 sm:w-14"
								>
									<Avatar.Image src={'/icon-128.png'} alt={''} />
									<Avatar.Fallback>{'BO'}</Avatar.Fallback>
								</Avatar.Root>
								{$page.data.numAttendees} attendee(s)
							</div>
						</div>
					{/if}
				</div>
				<Rsvp
					{rsvpStatus}
					userId={currUserId}
					eventId={event.id}
					{isAnonymousUser}
					{rsvpCanBeChanged}
				/>

				<Button
					onclick={() => handleShare(event)}
					class="mt-4 flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
				>
					<Share class="h-5 w-5" />
					Share Bonfire</Button
				>

				<HorizRule />
				<div class="my-10">
					<div class=" rounded-xl bg-white p-5 dark:bg-slate-900">
						<div class="font-semibold">Announcements</div>
					</div>
					{#if rsvpStatus}
						<div class="my-2">
							<Annoucements maxCount={3} {isUnverifiedUser} {currenUserIsEventAdmin} />
						</div>
						{#if currenUserIsEventAdmin}
							<a href="announcement/create">
								<Button
									class="mt-1 w-full ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
									><Drum class="mr-1 h-4 w-4" /> Create new announcement</Button
								>
							</a>
						{/if}
					{:else}
						<div class="my-2">
							<BonfireNoInfoCard text={$page.data.numAnnouncements + ' announcement(s)'} />
						</div>
					{/if}
				</div>
				<HorizRule />
				<div class="my-5">
					<div class=" rounded-xl bg-white p-5 dark:bg-slate-900">
						<div class="font-semibold">Gallery</div>
					</div>
					{#if rsvpStatus}
						<div class="mb-10">
							{#if eventFiles}
								<MiniGallery fileCount={fileCount - eventFiles.length} {eventFiles} />
							{:else if loadEventFiles}
								<Loader />
							{/if}
						</div>
					{:else}
						<div class="my-2">
							<BonfireNoInfoCard text={$page.data.numFiles + ' file(s)'} />
						</div>
					{/if}
				</div>
			</section>
		</div>
	{/if}
{:else}
	{console.log('YO this is an inconsistent state, eventLoading', eventLoading)}
{/if}
