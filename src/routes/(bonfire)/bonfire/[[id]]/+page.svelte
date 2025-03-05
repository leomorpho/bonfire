<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import { TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import {
		Cog,
		Share,
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
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import MiniGallery from '$lib/components/MiniGallery.svelte';
	import { toast } from 'svelte-sonner';
	import Annoucements from '$lib/components/Annoucements.svelte';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import EventDoesNotExist from '$lib/components/EventDoesNotExist.svelte';
	import CenterScreenMessage from '$lib/components/CenterScreenMessage.svelte';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { overlayColorStore, overlayOpacityStore, styleStore } from '$lib/styles';
	import ShareLocation from '$lib/components/ShareLocation.svelte';
	import type { BannerInfo, EventTypescriptType } from '$lib/types';
	import BonfireBanner from '$lib/components/BonfireBanner.svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import ImThreadView from '$lib/components/im/ImThreadView.svelte';
	import NumNewMessageIndicator from '$lib/components/im/NumNewMessageIndicator.svelte';
	import {
		addUserRequests,
		type TempUserData,
		updateTempUsersLiveDataStoreEntry
	} from '$lib/profilestore';
	import AttendeesDialog from '$lib/components/AttendeesDialog.svelte';
	import BringList from '$lib/components/bringlist/BringList.svelte';
	import AttendeesCount from '$lib/components/attendance/AttendeesCount.svelte';
	import NoAttendeesYet from '$lib/components/attendance/NoAttendeesYet.svelte';
	import AnonAttendeesView from '$lib/components/attendance/AnonAttendeesView.svelte';
	import MaxCapacityInfo from '$lib/components/attendance/MaxCapacityInfo.svelte';

	const showMaxNumPeople = 50;
	const tempAttendeeId = $page.data.tempAttendeeId;
	const tempAttendeeSecret = $page.url.searchParams.get(tempAttendeeSecretParam);

	let client: TriplitClient;
	let currUserId = $state('');
	let event = $state<EventTypescriptType | null>(null);
	let eventLoading = $state(true);
	let eventFailedLoading = $state(false);
	let fileCount = $state(0);
	let rsvpStatus = $state('');

	let isUnverifiedUser = $derived(!!tempAttendeeId);
	let tempAttendee = $state(null);
	let currentUserAttendee = $state();
	let isCurrenUserEventAdmin = $state(false);
	let isAnonymousUser = $state(!$page.data.user);
	let adminUserIds = $state(new Set<string>());

	let rsvpCanBeChanged = $state(false);
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

	let latitude = $state(null);
	let longitude = $state(null);

	let bannerInfo: BannerInfo = $state($page.data.bannerInfo);

	// TODO: support events created before payments system was created. There was no concept of "published"/"draft". Remove once all events have an attached transaction.
	const paymentsReleaseDate = new Date(publicEnv.PUBLIC_PAYMENTS_RELEASE_DATE);
	let isEventPublished = $derived(event?.is_published || event?.created_at < paymentsReleaseDate);

	$effect(() => {
		if ($page.data.user) {
			currUserId = $page.data.user.id;
		}
	});

	// $effect(() => {
	// 	console.log('==== rsvpStatus', rsvpStatus);
	// });

	if (tempAttendeeId) {
		tempAttendeeSecretStore.set(tempAttendeeId);
	}

	$effect(() => {
		if (isUnverifiedUser) {
			isAnonymousUser = false;
		}
	});

	// $effect(() => {
	// 	console.log(
	// 		`isAnonymousUser: ${isAnonymousUser}, isUnverifiedUser: ${isUnverifiedUser}, $page.data.user: ${$page.data.user}`
	// 	);
	// });

	$effect(() => {
		if (
			(event && currUserId && event.user_id == (currUserId as string)) ||
			adminUserIds.has(currUserId)
		) {
			isCurrenUserEventAdmin = true;
		}
	});

	$effect(() => {
		if (event) {
			rsvpCanBeChanged = new Date(event.start_time) >= new Date() && rsvpEnabledForCapacity;
		}
	});

	$effect(() => {
		// Ensure event data and currUserId are available
		if ($page.data.user && allAttendees && currUserId) {
			// Find the current user's RSVP status in the attendees list
			const attendees = allAttendees;

			if (attendees && attendees.length > 0) {
				currentUserAttendee = attendees.find((attendee) => attendee.user_id == currUserId);
				// Set RSVP status based on the attendee record, or keep it as default
				rsvpStatus = currentUserAttendee ? currentUserAttendee.status : undefined;
				if (dev) {
					$inspect('### rsvpStatus', rsvpStatus);
				}
			}
		}
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

	let rsvpEnabledForCapacity: boolean = $derived(
		!event?.max_capacity ||
			currentUserAttendee ||
			(event?.max_capacity &&
				allAttendeesGoing.length < event?.max_capacity &&
				$page.data.numAttendingGoing < event?.max_capacity)
	) as boolean;

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
			// console.log('eventFiles', eventFiles);
		} catch (error) {
			console.error('Error fetching event files:', error);
		} finally {
			loadEventFiles = false;
		}
	};

	/**
	 * Fetches banner information for a given Bonfire (event) ID.
	 *
	 * @param {string} bonfireId - The ID of the bonfire (event).
	 * @param {string | null} tempAttendeeSecret - (Optional) Temporary attendee secret.
	 * @returns {Promise<BannerInfo | null>} - The banner information or null if not found.
	 */
	async function fetchBannerInfo(bonfireId: string, tempAttendeeSecret: string | null = null) {
		try {
			// Construct the URL with optional temp attendee authentication
			let url = `/bonfire/${bonfireId}/media/get-banner`;
			if (tempAttendeeSecret) {
				url += `?${tempAttendeeSecretParam}=${encodeURIComponent(tempAttendeeSecret)}`;
			}

			// Fetch the banner data
			const response = await fetch(url, {
				method: 'GET',
				credentials: 'include', // Ensure cookies and auth tokens are sent
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// Handle non-OK responses (403, 404, etc.)
			if (!response.ok) {
				if (response.status === 403) {
					console.warn('User is not an attendee of this event.');
					return null;
				}
				if (response.status === 404) {
					console.warn('No banner found for this event.');
					return null;
				}
				throw new Error(`Failed to fetch banner: ${response.statusText}`);
			}
			console.log('OLD bannerInfo', bannerInfo);
			// Parse the response JSON
			bannerInfo = await response.json();
			console.log('NEW bannerInfo', bannerInfo);
		} catch (error) {
			console.error('Error fetching banner info:', error);
			return null;
		}
	}

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

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
				},
				// Optional
				{
					localOnly: false,
					onRemoteFulfilled: () => {
						eventLoading = false;
					}
				}
			);
		}

		if (
			(isAnonymousUser || !$page.data.isUserAnAttendee) &&
			$page.data.event &&
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
					event = results[0] as EventTypescriptType;
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

						if (event.banner_media.blurr_hash != bannerInfo.bannerBlurHash) {
							fetchBannerInfo($page.params.id, tempAttendeeSecret);
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

				const userIds = [...new Set(results.map((attendee) => attendee.user_id))];
				if (dev) {
					console.log('===> userIds', userIds);
				}

				addUserRequests(userIds);
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

				for (let attendee of results) {
					const tempUser: TempUserData = {
						id: attendee.id,
						username: attendee.name
					};
					updateTempUsersLiveDataStoreEntry(tempUser);
				}
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

	function scrollToBottom() {
		window.scrollTo({
			top: document.body.scrollHeight,
			behavior: 'smooth'
		});
	}

	let activeTab = $state('about');

	// Function to programmatically change tabs
	const changeToDiscussionsTab = () => {
		activeTab = ''; // NOTE: this is a hack to make it work, otherwise it only works the first time.
		activeTab = 'discussions';
	};
</script>

{#snippet details(event: any)}
	<div
		class="my-5 flex flex-col justify-center rounded-xl bg-slate-100 p-2 text-center shadow-lg dark:bg-slate-800"
	>
		<div class="font-semibold">Details</div>
		{#if event.description}
			<div class="whitespace-pre-wrap">
				{event.description}
			</div>
		{:else}
			{'No details yet...'}
		{/if}
	</div>
{/snippet}

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
			{#if isCurrenUserEventAdmin}
				<div class="flex w-full justify-center">
					<a href="update" id="edit-bonfire">
						<Button variant="outline" class="m-2 rounded-full">
							<Cog class="h-5 w-5" />
						</Button>
					</a>
				</div>
			{/if}
			<section
				class="mt-4 flex w-full justify-center sm:w-[450px] md:w-[550px] lg:w-[750px] xl:w-[950px]"
			>
				<Tabs.Root value={activeTab} class="w-full">
					<div class="flex w-full justify-center">
						<Tabs.List class="mb-1 w-full bg-transparent animate-in fade-in zoom-in">
							<div class="rounded-lg bg-slate-700 p-2">
								<Tabs.Trigger value="about" class="focus:outline-none focus-visible:ring-0">
									About
								</Tabs.Trigger>
								<Tabs.Trigger
									value="discussions"
									class="focus:outline-none focus-visible:ring-0"
									onclick={scrollToBottom}
								>
									<NumNewMessageIndicator>Discussions</NumNewMessageIndicator>
								</Tabs.Trigger>
							</div>
						</Tabs.List>
					</div>
					<Tabs.Content value="about" class="w-full">
						<div class="animate-fadeIn">
							<!-- TODO: allow temp attendees to delete themselves -->
							{#if isUnverifiedUser}
								<div
									class="my-4 flex flex-col items-center justify-center space-y-2 rounded-lg bg-gradient-to-r from-violet-200 to-pink-200 p-5 text-center dark:from-violet-900 dark:to-pink-900"
								>
									{#if tempAttendee}
										<p class="font-semibold">Hi {tempAttendee.name}! This is a temporary account</p>
									{:else}
										<p class="font-semibold">Hi! This is a temporary account</p>
									{/if}
									<p class="text-sm">
										Keep this tab open for seamless access, or click the button below to copy the
										URL and save it.
									</p>
									<p class="text-sm">
										This URL grants access to the event with your temporary identity.
									</p>
									<p class="text-sm">Sign up anytime to link your events to your email.</p>
									<a href="/login" class="w-full">
										<Button
											class="mt-4 flex w-full items-center justify-center bg-blue-500 text-white hover:bg-blue-400"
										>
											<KeyRound class="h-5 w-5" />
											Sign Up or Log In</Button
										>
									</a>
									<Button
										onclick={() => handleCopyingTempAccountUrl(event)}
										class="mt-4 flex w-full items-center justify-center dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
									>
										<Copy class="h-5 w-5" />
										Copy Link</Button
									>
								</div>
							{/if}

							<div
								class="relative space-y-3 rounded-xl bg-white bg-opacity-90 p-5 dark:bg-slate-900 dark:bg-opacity-90"
							>
								{#if !isEventPublished}
									<div
										class="absolute -right-1 -top-1 z-20 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md dark:bg-red-500 sm:text-sm"
									>
										Not Published
									</div>
								{/if}
								{#if bannerInfo && bannerInfo.bannerIsSet}
									<div class="flex w-full justify-center">
										<BonfireBanner
											blurhash={bannerInfo.bannerBlurHash}
											bannerSmallSizeUrl={bannerInfo.bannerSmallSizeUrl}
											bannerLargeSizeUrl={bannerInfo.bannerLargeSizeUrl}
											{isCurrenUserEventAdmin}
										/>
									</div>
								{:else if isCurrenUserEventAdmin}
									<a class="flex w-full" href="banner/upload">
										<Button class="w-full dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
											>Set a banner image</Button
										>
									</a>
								{/if}
								<h1
									class="flex justify-center py-3 text-center text-2xl font-bold sm:text-3xl lg:text-4xl"
								>
									{event.title}
								</h1>
								<div class="flex w-full space-x-3">
									<div class="hidden sm:block sm:w-1/2">
										{@render details(event)}
									</div>
									<div class="w-full sm:w-1/2">
										<div class="flex items-center justify-center font-medium">
											<Calendar class="mr-2 !h-4 !w-4 shrink-0" />{formatHumanReadable(
												event.start_time
											)}
											{#if event.end_time}to {formatHumanReadableHour(event.end_time)}{/if}
										</div>
										<div class="flex items-center justify-center font-light">
											{#if event.organizer}
												<UserRound class="mr-2 !h-4 !w-4 shrink-0" />Hosted by
												{#if rsvpStatus}
													<div class="ml-2">
														<ProfileAvatar userId={event.organizer['id']} />
													</div>
												{:else}
													{event.organizer['username']}
												{/if}
											{/if}
										</div>

										<div class="flex items-center justify-center font-light">
											<MapPin class="mr-2 !h-4 !w-4 shrink-0" />
											{#if rsvpStatus}
												{#if event.location}<div class="flex items-center justify-center">
														{#if latitude && longitude}
															<ShareLocation lat={latitude} lon={longitude}>
																<div
																	id="share-location"
																	class="flex items-center justify-center rounded-xl bg-slate-100 p-2 dark:bg-slate-900"
																>
																	{@html event.location}
																	<ArrowRightFromLine class="ml-2 !h-4 !w-4 shrink-0" />
																</div>
															</ShareLocation>
														{:else}
															<div class="flex items-center justify-center p-2">
																{event.location}
															</div>
														{/if}
													</div>
												{:else}
													<div>No location set</div>
												{/if}
											{:else}
												Set RSVP status to see location
											{/if}
										</div>
									</div>
								</div>

								<div class="block sm:hidden">
									{@render details(event)}
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
									{#if allAttendeesGoing.length > 0}
										<AttendeesCount
											{allAttendeesGoing}
											{allAttendeesMaybeGoing}
											{allAttendeesNotGoing}
										/>

										<div
											id="going-attendees"
											class="flex flex-wrap items-center justify-center -space-x-4"
										>
											{#each allAttendeesGoing.slice(0, showMaxNumPeople) as attendee}
												<ProfileAvatar
													userId={attendee.user_id}
													tempUserName={attendee.name}
													viewerIsEventAdmin={isCurrenUserEventAdmin}
													attendanceId={attendee.id}
													baseHeightPx={allAttendeesGoing.length < 10 ? 60 : 50}
												/>
											{/each}
											<AttendeesDialog
												{allAttendeesGoing}
												{allAttendeesMaybeGoing}
												{allAttendeesNotGoing}
												{showMaxNumPeople}
												{isCurrenUserEventAdmin}
											/>
										</div>
									{:else if allAttendeesGoing.length == 0}
										<NoAttendeesYet />
									{/if}
								{:else}
									<AnonAttendeesView numAttendingGoing={$page.data.numAttendingGoing} />
								{/if}
							</div>
							<!-- Show RSVP if:
				 (a) no max capacity is set
				 (b) current user is attending
				 (b) if max capacity is set, if it is not yet attained -->
							<!-- {console.log(
					'max capacity',
					event?.max_capacity,
					'currentUserAttendee',
					currentUserAttendee,
					'allAttendeesGoing.length',
					allAttendeesGoing.length,
					'$page.data.numAttendingGoing',
					$page.data.numAttendingGoing,
					'rsvpCanBeChanged',
					rsvpCanBeChanged
				)} -->
							{#if event?.max_capacity}
								<MaxCapacityInfo
									maxCapacity={event?.max_capacity}
									rsvpEnabled={rsvpEnabledForCapacity}
								/>
							{/if}
							<div class="flex w-full justify-center">
								<div class="w-full md:max-w-96 flex flex-col">
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
								</div>
							</div>
							<HorizRule />
							<div class="my-10 flex flex-col md:flex-row md:space-x-2">
								<div class="w-full rounded-xl p-0 md:w-1/2 md:p-2">
									<div class="rounded-xl bg-white p-5 dark:bg-slate-900">
										<div class="font-semibold">Announcements</div>
									</div>
									{#if rsvpStatus}
										<div class="my-2">
											<Annoucements maxCount={3} {isUnverifiedUser} {isCurrenUserEventAdmin} />
										</div>
										{#if isCurrenUserEventAdmin}
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
								{#if currUserId || tempAttendeeId}
									<HorizRule />
									<div class="w-full rounded-xl p-0 md:w-1/2 md:p-2">
										<BringList
											eventId={event.id}
											isAdmin={isCurrenUserEventAdmin}
											numAttendeesGoing={allAttendeesGoing.length}
											{currUserId}
											{tempAttendeeId}
											{changeToDiscussionsTab}
										/>
									</div>
								{/if}
							</div>
							<HorizRule />

							<div>
								<div class="rounded-xl bg-white p-5 dark:bg-slate-900">
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
						</div>
					</Tabs.Content>
					<Tabs.Content value="discussions" class="mb-2 h-[calc(100vh-4rem)] w-full">
						<div class="animate-fadeIn mb-2 h-[calc(100vh-4rem)] w-full">
							{#if rsvpStatus}
								<ImThreadView
									{currUserId}
									canSendIm={!!rsvpStatus && !!currUserId}
									eventId={event.id}
									datetimeUserJoinedBonfire={currentUserAttendee?.updated_at}
									{isCurrenUserEventAdmin}
								/>
							{:else}
								<div class="flex h-40 items-center justify-center">
									<div
										class="m-1 mt-10 flex h-24 w-3/4 items-center justify-center rounded-xl bg-slate-500 p-5 text-lg text-white opacity-80 dark:bg-slate-800 dark:text-slate-100"
									>
										RSVP first!
									</div>
								</div>
							{/if}
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</section>
		</div>
	{/if}
{:else}
	{console.log('YO this is an inconsistent state, eventLoading', eventLoading)}
{/if}

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
