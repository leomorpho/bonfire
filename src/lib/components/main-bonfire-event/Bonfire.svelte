<script lang="ts">
	import { dev } from '$app/environment';
	import { TriplitClient } from '@triplit/client';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Share, ShoppingBasket, History, MessageCircle, Info } from 'lucide-svelte';
	import Rsvp from '$lib/components/rsvp/Rsvp.svelte';
	import { onMount, tick } from 'svelte';
	import {
		Status,
		tempAttendeeSecretStore,
		tempAttendeeSecretParam,
		BonfireTabs
	} from '$lib/enums';
	import MiniGallery from '$lib/components/MiniGallery.svelte';
	import { toast } from 'svelte-sonner';
	import Annoucements from '$lib/components/announcements/Annoucements.svelte';
	import HorizRule from '$lib/components/HorizRule.svelte';
	import EventDoesNotExist from '$lib/components/EventDoesNotExist.svelte';
	import CenterScreenMessage from '$lib/components/CenterScreenMessage.svelte';
	import BonfireNoInfoCard from '$lib/components/BonfireNoInfoCard.svelte';
	import { overlayColorStore, overlayOpacityStore, styleStore } from '$lib/styles';
	import type { EventTypescriptType } from '$lib/types';
	import { env as publicEnv } from '$env/dynamic/public';
	import ImThreadView from '$lib/components/im/ImThreadView.svelte';
	import NumNewMessageIndicator from '$lib/components/im/NumNewMessageIndicator.svelte';
	import {
		addUserRequests,
		type TempUserData,
		updateTempUsersLiveDataStoreEntry
	} from '$lib/profilestore';
	import BringList from '$lib/components/bringlist/BringList.svelte';
	import MaxCapacityInfo from '$lib/components/attendance/MaxCapacityInfo.svelte';
	import EditEventButton from '$lib/components/main-bonfire-event/EditEventButton.svelte';
	import UnverifiedUserMsg from '$lib/components/main-bonfire-event/UnverifiedUserMsg.svelte';
	import EventInfo from '$lib/components/main-bonfire-event/EventInfo.svelte';
	import Attendees from '$lib/components/main-bonfire-event/Attendees.svelte';
	import SignUpMsg from './SignUpMsg.svelte';
	import SetProfilePicAlert from './SetProfilePicAlert.svelte';
	import EventHistory from './EventHistory.svelte';
	import { CircleAlert, SlidersHorizontal } from '@lucide/svelte';
	import EventSettings from '../settings/event-settings/EventSettings.svelte';
	import PermissionsPausedMsg from '../settings/PermissionsPausedMsg.svelte';
	import { scrollElementIntoView } from '$lib/utils';
	import { fetchBannerInfo } from '$lib/gallery';
	// import EventStylerBottomSheet from '../event-styles/EventStylerBottomSheet.svelte';

	let {
		currUserId,
		eventOrganizerId,
		eventOrganizerUsername,
		eventId,
		eventCreatorUserId,
		eventStartTime,
		eventEndTime,
		eventTitle,
		eventDescription,
		eventIsPublished,
		eventLocation,
		eventNumAttendeesGoing,
		eventMaxCapacity,
		eventNumAnnouncements,
		eventNumFiles,
		eventNumBringListItems,
		bannerInfo,
		isUserAnAttendee,
		jwt,
		tempAttendeeId,
		tempAttendeeSecret,
		fileCount = 0,
		maxNumGuestsAllowedPerAttendee = 0,
		numGuestsCurrentAttendeeIsBringing = 0,
		isBringListEnabled = false,
		requireGuestBringItem = false,
		showMaxNumPeople = 30
	} = $props();

	let client: TriplitClient;

	let eventLoading = $state(true);
	let eventFailedLoading = $state(false);
	let rsvpStatus: string | null = $state(null);

	let tempAttendee: any = $state(null);
	let currentUserAttendee: any = $state();
	let isCurrenUserEventAdmin = $state(false);
	let isUnverifiedUser = $derived(!!tempAttendeeId);
	let isAnonymousUser = $derived(!isUnverifiedUser && !currUserId);
	let adminUserIds = $state(new Set<string>());

	let rsvpCanBeChanged = $state(false);
	let eventFiles: any[] = $state([]);
	let loadEventFiles = $state(true);

	let attendeesGoing: any = $state([]);
	let tempAttendeesGoing: any = $state([]);

	let attendeesMaybeGoing: any = $state([]);
	let tempAttendeesMaybeGoing: any = $state([]);

	let attendeesNotGoing: any = $state([]);
	let tempAttendeesNotGoing: any = $state([]);

	let attendeesLeft: any = $state([]);
	let attendeesRemoved: any = $state([]);
	let tempAttendeesRemoved: any = $state([]);

	let attendeesLoading = $state(true);
	let tempAttendeesLoading = $state(true);

	let latitude = $state(null);
	let longitude = $state(null);

	if (tempAttendeeId) {
		tempAttendeeSecretStore.set(tempAttendeeId);
	}

	// $inspect(
	// 	'isAnonymousUser',
	// 	isAnonymousUser,
	// 	'isUnverifiedUser',
	// 	isUnverifiedUser,
	// 	'tempAttendeeId',
	// 	tempAttendeeId,
	// 	!!tempAttendeeId
	// );

	$effect(() => {
		if (
			(eventId && currUserId && eventCreatorUserId == (currUserId as string)) ||
			adminUserIds.has(currUserId)
		) {
			isCurrenUserEventAdmin = true;
		}
	});

	$effect(() => {
		if (eventId && eventStartTime) {
			rsvpCanBeChanged = new Date(eventStartTime) >= new Date() && rsvpEnabledForCapacity;
		}
	});

	$effect(() => {
		// Ensure event data and currUserId are available
		if (currUserId && allAttendees) {
			// Find the current user's RSVP status in the attendees list
			const attendees = allAttendees;

			if (attendees && attendees.length > 0) {
				currentUserAttendee = attendees.find((attendee) => attendee.user_id == currUserId);
				// Set RSVP status based on the attendee record, or keep it as default
				if (currentUserAttendee) {
					rsvpStatus = currentUserAttendee.status;
					numGuestsCurrentAttendeeIsBringing = currentUserAttendee.guest_count;
				}

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
	let allAttendeesLeft = $derived([...(attendeesLeft || [])]);
	let allAttendeesRemoved = $derived([
		...(attendeesRemoved || []),
		...(tempAttendeesRemoved || [])
	]);

	// Count real users, temporary users and all their guests
	let rsvpEnabledForCapacity: boolean = $derived(
		!eventMaxCapacity ||
			currentUserAttendee ||
			(eventMaxCapacity &&
				allAttendeesGoing.reduce((total, attendee) => total + (attendee.guest_count || 0) + 1, 0) <
					eventMaxCapacity &&
				eventNumAttendeesGoing < eventMaxCapacity)
	) as boolean;

	const convertGeocodedLocationToLatLon = (eventGeocodedLocation: any) => {
		if (!eventGeocodedLocation) return;

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

	onMount(() => {
		client = getFeWorkerTriplitClient(jwt) as TriplitClient;

		// TODO: below can be squashed into the above unsubscribeTempAttendeesQuery
		let unsubscribeTemporaryUserQuery = null;
		if (isUnverifiedUser) {
			unsubscribeTemporaryUserQuery = client.subscribe(
				client.query('temporary_attendees').Where([['id', '=', tempAttendeeId]]),
				(results) => {
					if (results.length == 1) {
						tempAttendee = results[0];
						rsvpStatus = tempAttendee?.status;
						numGuestsCurrentAttendeeIsBringing = tempAttendee?.guest_count;
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

		if (isAnonymousUser || !isUserAnAttendee) {
			// If user is anonymous, load event data from page data. It will contain limited data.
			// Also, if the user is logged in but is NOT YET attending, we don't want to pull live data
			// since they won't have the permissions to.
			console.log(
				'not fetching event data because user is anonymous or not an attendee, and therefore only data returned from BE will be shown'
			);
			eventLoading = false;
			attendeesLoading = false;
			return;
		}

		eventLoading = true;

		// Update event data based on the current page id
		const unsubscribeFromEventQuery = client.subscribe(
			client
				.query('events')
				.Where([['id', '=', eventId]])
				.Include('banner_media')
				.Include('event_admins')
				.SubqueryOne(
					'organizer',
					client.query('user').Where(['id', '=', '$1.user_id']).Select(['username', 'id'])
				),
			(results) => {
				if (results.length == 1) {
					const event: any = results[0] as EventTypescriptType;
					// console.log('EVENT', event);
					if (event) {
						if (event.longitude && event.latitude) {
							// NOTE: if user sets these (from the map) it should override the geocoding from any address
							latitude = event.latitude;
							longitude = event.longitude;
						} else if (event.geocoded_location) {
							try {
								convertGeocodedLocationToLatLon(JSON.parse(event.geocoded_location as string));
							} catch (e) {
								console.log(e);
							}
						}
						styleStore.set(event.style);
						overlayColorStore.set(event.overlay_color);
						overlayOpacityStore.set(event.overlay_opacity);

						maxNumGuestsAllowedPerAttendee = event.max_num_guests_per_attendee ?? 0;
						console.log('maxNumGuestsAllowedPerAttendee', maxNumGuestsAllowedPerAttendee);

						if (event.event_admins) {
							adminUserIds = new Set(
								event.event_admins.map((admin: { user_id: string }) => admin.user_id)
							);
						}

						if (
							event.banner_media?.blurr_hash &&
							event.banner_media.blurr_hash != bannerInfo.bannerBlurHash
						) {
							const fetchNewBanner = async () => {
								bannerInfo = await fetchBannerInfo(eventId, tempAttendeeSecret);
							};
							fetchNewBanner();
						}
						eventLoading = false;
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
				await fetchEventFiles(eventId);
			})();
		}

		const unsubscribeAttendeesQuery = client.subscribe(
			client
				.query('attendees')
				.Where([['event_id', '=', eventId]])
				.Include('user'),
			(results) => {
				// console.log('attendees', results);

				// Separate attendees into different variables by status
				attendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				attendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				attendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);
				attendeesLeft = results.filter((attendee) => attendee.status === Status.LEFT);
				attendeesRemoved = results.filter((attendee) => attendee.status === Status.REMOVED);

				const userIds = [...new Set(results.map((attendee) => attendee.user_id))];
				// if (dev) {
				// 	console.log('===> userIds', userIds);
				// }

				addUserRequests(userIds);
				attendeesLoading = false;
				// console.log('results', results);
			},
			(error) => {
				console.error('Error fetching attendees:', error);
			}
		);

		const unsubscribeTempAttendeesQuery = client.subscribe(
			client.query('temporary_attendees').Where([['event_id', '=', eventId]]),
			(results) => {
				// // Separate attendees into different variables by status
				tempAttendeesGoing = results.filter((attendee) => attendee.status === Status.GOING);
				tempAttendeesNotGoing = results.filter((attendee) => attendee.status === Status.NOT_GOING);
				tempAttendeesMaybeGoing = results.filter((attendee) => attendee.status === Status.MAYBE);
				tempAttendeesRemoved = results.filter((attendee) => attendee.status === Status.REMOVED);

				for (let attendee of results) {
					const tempUser: TempUserData = {
						id: attendee?.id,
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
				.Where([['event_id', '=', eventId]])
				.Select(['id']),
			(results) => {
				// If there are less than 3 files in the events eventFiles, fetch the latest 3
				(async () => {
					await fetchEventFiles(eventId);
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

		loadScrollParamFromURL();

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

		function scrollToElement(elementId: string) {
			const element = document.getElementById(elementId);
			console.log('SCROLLING TO EL', element);

			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}

		// Load the scroll parameter from the URL
		function loadScrollParamFromURL() {
			const urlParams = new URLSearchParams(window.location.search);
			const scrollToId = urlParams.get('scrollTo');
			console.log('SCROLLING TO', scrollToId);
			if (scrollToId) {
				scrollToElement(scrollToId);
			}
		}
	});

	const handleShare = async (eventTitle: string, eventLocation: string, eventId: string) => {
		// Prepare shareable data
		const shareData = {
			title: `Hey! You're invited to ${eventTitle}!`, // Use the event title
			text: `Please RSVP via the link so we can plan accordingly. If we don’t hear from you, we’ll assume you can't make it.`,
			url: `${publicEnv.PUBLIC_ORIGIN}/bonfire/${eventId}` // Use the event's unique ID in the URL
		};

		toast.success('Invitation copied to clipboard!');

		// Add data to clipboard
		try {
			const clipboardText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
			await navigator.clipboard.writeText(clipboardText);
		} catch (error) {
			console.error('Error copying to clipboard:', error);
		}

		if (!navigator.share) {
			return;
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

	let activeTab = $state('about');

	// Function to programmatically change tabs
	const changeToDiscussionsTab = async () => {
		activeTab = ''; // NOTE: this is a hack to make it work, otherwise it only works the first time.
		activeTab = 'discussions';
		await tick(); // Ensure the DOM is updated
		await scrollElementIntoView('messenger');
	};

	function updateURL(tabName: string): void {
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tabName);
		window.history.pushState({}, '', url);
	}

	function loadStepFromURL(): void {
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		if (tabParam) {
			activeTab = tabParam;
		}
	}

	onMount(() => {
		loadStepFromURL();
	});
</script>

{#if !isAnonymousUser && !isUnverifiedUser && eventLoading}
	<Loader />
{:else if eventFailedLoading}
	<CenterScreenMessage
		message={'Oups, we apologize but the event failed to load, please try again later 😓'}
	/>
{:else if !eventLoading}
	{#if !eventId}
		<EventDoesNotExist />
	{:else}
		<div class="mx-4 flex flex-col items-center justify-center">
			{#if !isUnverifiedUser && !isAnonymousUser}
				<SetProfilePicAlert {currUserId} />
			{/if}
			{#if isAnonymousUser || isUnverifiedUser}
				<SignUpMsg />
			{/if}

			<section
				class="mt-4 flex w-full justify-center sm:w-[450px] md:w-[550px] lg:w-[800px] xl:w-[950px]"
			>
				<Tabs.Root value={activeTab} class="w-full">
					<div class="sticky top-3 z-[50] flex w-full justify-center">
						<Tabs.List class="w-full bg-transparent animate-in fade-in zoom-in">
							<div class="flex items-center rounded-lg bg-white p-2 shadow-2xl dark:bg-black">
								<Tabs.Trigger
									id="about-tab"
									value={BonfireTabs.About}
									class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-emerald-500 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-600"
									onclick={() => {
										updateURL(BonfireTabs.About);
									}}
								>
									<Info class="h-6 w-6" />
								</Tabs.Trigger>
								<Tabs.Trigger
									id="discussions-tab"
									value={BonfireTabs.Discussions}
									class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-orange-500 data-[state=active]:text-white dark:data-[state=active]:bg-orange-600"
									onclick={() => {
										scrollElementIntoView('messenger');
										updateURL(BonfireTabs.Discussions);
									}}
								>
									<NumNewMessageIndicator>
										<MessageCircle class="h-6 w-6" />
									</NumNewMessageIndicator>
								</Tabs.Trigger>
								{#if currUserId}
									<Tabs.Trigger
										id="settings-tab"
										value={BonfireTabs.UserSettings}
										class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600"
										onclick={() => {
											updateURL(BonfireTabs.UserSettings);
										}}
									>
										<div class="flex items-center justify-center">
											<SlidersHorizontal class="h-6 w-6" />
										</div>
									</Tabs.Trigger>
								{/if}
								{#if isCurrenUserEventAdmin}
									<Tabs.Trigger
										id="history-tab"
										value={BonfireTabs.History}
										class="focus:outline-none focus-visible:ring-0 data-[state=active]:bg-purple-500 data-[state=active]:text-white dark:data-[state=active]:bg-purple-600"
										onclick={() => {
											updateURL(BonfireTabs.History);
										}}
									>
										<div class="flex items-center justify-center">
											<History class="h-6 w-6" />
										</div>
									</Tabs.Trigger>
									<div
										id="settings-tab-where-theres-no-tab"
										class="duration-250 inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-blue-500 ring-offset-background transition-all hover:bg-slate-200 focus:outline-none focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-700"
									>
										<div class="flex items-center justify-center">
											<EditEventButton {eventIsPublished} />
										</div>
									</div>
								{/if}
							</div>
						</Tabs.List>
					</div>
					<Tabs.Content value="about" class="mb-10 w-full">
						<div class="animate-fadeIn">
							<!-- TODO: allow temp attendees to delete themselves -->

							{#if isUnverifiedUser}
								<UnverifiedUserMsg {eventId} {tempAttendee} {tempAttendeeSecret} />
							{/if}
							<!-- <PermissionsPausedMsg userId={currUserId} /> -->

							<EventInfo
								{eventId}
								{bannerInfo}
								{isCurrenUserEventAdmin}
								{eventOrganizerId}
								{eventOrganizerUsername}
								{eventTitle}
								{eventDescription}
								{eventStartTime}
								{eventEndTime}
								{rsvpStatus}
								{eventLocation}
								{latitude}
								{longitude}
							/>

							<Attendees
								{rsvpStatus}
								{attendeesLoading}
								{allAttendeesGoing}
								{allAttendeesMaybeGoing}
								{allAttendeesNotGoing}
								{allAttendeesLeft}
								{allAttendeesRemoved}
								{eventNumAttendeesGoing}
								{showMaxNumPeople}
								{isCurrenUserEventAdmin}
							/>
							<!-- Show RSVP if:
				 (a) no max capacity is set
				 (b) current user is attending
				 (b) if max capacity is set, if it is not yet attained -->
							{#if eventMaxCapacity}
								<MaxCapacityInfo
									maxCapacity={eventMaxCapacity}
									rsvpEnabled={rsvpEnabledForCapacity}
								/>
							{/if}
							<div class="flex w-full justify-center">
								<div class="flex w-full flex-col md:max-w-96">
									<Rsvp
										{rsvpStatus}
										userId={currUserId}
										{eventId}
										{isAnonymousUser}
										{rsvpCanBeChanged}
										{maxNumGuestsAllowedPerAttendee}
										{numGuestsCurrentAttendeeIsBringing}
										eventOwnerId={eventCreatorUserId}
										{eventTitle}
										{eventStartTime}
										{eventEndTime}
										{eventDescription}
										{eventLocation}
									/>

									<Button
										disabled={!eventIsPublished}
										onclick={() => handleShare(eventTitle, eventLocation, eventId)}
										class="mt-4 flex w-full items-center justify-center bg-orange-600 ring-glow hover:bg-orange-500 dark:bg-orange-700 dark:text-white dark:hover:bg-orange-600"
									>
										<Share class="h-5 w-5" />
										<span class="">Share Bonfire</span>
										{#if !eventIsPublished}
											<span class="ml-2 flex items-center truncate text-red-500">
												<CircleAlert class="mr-1" />
												<span>Publish event first</span>
											</span>
										{/if}
									</Button>
								</div>
							</div>
							<!-- <HorizRule /> -->

							<div class="my-10 flex flex-wrap justify-center gap-5">
								<div id="announcements" class="w-full rounded-xl py-5 lg:w-[calc(50%-0.9rem)]">
									<Annoucements
										{rsvpStatus}
										maxCount={3}
										{isUnverifiedUser}
										{isCurrenUserEventAdmin}
										{eventNumAnnouncements}
									/>
								</div>
								{#if isBringListEnabled}
									<div class="w-full rounded-xl py-5 lg:w-[calc(50%-0.9rem)]">
										<BringList
											{eventId}
											isAdmin={isCurrenUserEventAdmin}
											numAttendeesGoing={allAttendeesGoing.length}
											{currUserId}
											{tempAttendeeId}
											{changeToDiscussionsTab}
											{requireGuestBringItem}
											{isCurrenUserEventAdmin}
											isCurrUserAttending={!!rsvpStatus}
											{eventNumBringListItems}
										/>
									</div>
								{/if}

								<div class="w-full rounded-xl py-5 lg:w-[calc(50%-0.9rem)]">
									<MiniGallery
										{eventNumFiles}
										fileCount={fileCount - eventFiles.length}
										{eventFiles}
										{loadEventFiles}
										{rsvpStatus}
									/>
								</div>
							</div>
						</div>
					</Tabs.Content>
					<Tabs.Content value="discussions" class="mb-2 h-[calc(100vh-4rem)] w-full">
						<div class="animate-fadeIn mb-2 h-[calc(95vh-4rem)] w-full">
							{#if rsvpStatus}
								<ImThreadView
									{currUserId}
									canSendIm={!!rsvpStatus && !!currUserId}
									{eventId}
									datetimeUserJoinedBonfire={currentUserAttendee?.updated_at}
									{isCurrenUserEventAdmin}
								/>
							{:else}
								<div class="flex h-40 items-center justify-center">
									<div
										class="m-1 mt-10 flex h-24 w-3/4 items-center justify-center rounded-xl bg-slate-500 p-5 text-lg text-white opacity-80 dark:bg-slate-900 dark:text-slate-100"
									>
										RSVP first!
									</div>
								</div>
							{/if}
						</div>
					</Tabs.Content>
					{#if currUserId}
						<Tabs.Content value="user-settings" class="mb-10 w-full">
							<div class="animate-fadeIn mb-2 w-full">
								<EventSettings {eventId} />
							</div>
						</Tabs.Content>
					{/if}
					{#if currUserId && isCurrenUserEventAdmin}
						<Tabs.Content value="history" class="mb-10 w-full">
							<div class="animate-fadeIn mb-2 w-full">
								<EventHistory {eventId} />
							</div>
						</Tabs.Content>
					{/if}
				</Tabs.Root>
			</section>
		</div>
	{/if}
	<div class="mx-4 flex flex-col items-center justify-center pb-5">
		<section class="flex w-full justify-center sm:w-[450px] md:w-[550px] lg:w-[800px] xl:w-[950px]">
			<HorizRule />

			<a class="flex w-full justify-center" href="/bonfire/create">
				<Button variant="link" class="rounded-xl bg-orange-300/60 dark:bg-orange-800/60"
					>Host your event with Bonfire</Button
				>
			</a>
		</section>
	</div>
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
