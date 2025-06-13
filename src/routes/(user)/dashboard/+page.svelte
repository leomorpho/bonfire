<script lang="ts">
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { onMount } from 'svelte';
	import { and, type TriplitClient } from '@triplit/client';
	import Loader from '$lib/components/Loader.svelte';
	import { DatabaseZap, Frown, Plus, Building2 } from 'lucide-svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import EventCardSkeleton from '$lib/components/EventCardSkeleton.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import Button from '$lib/components/ui/button/button.svelte';
	import PullToRefresh from '$lib/components/settings/PullToRefresh.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Status } from '$lib/enums';
	import PermissionsPausedMsg from '$lib/components/settings/PermissionsPausedMsg.svelte';
	import SetupMeet from '$lib/components/meet/SetupMeet.svelte';

	let client: TriplitClient;

	// Initialize with server data
	let futureAttendances: any = $state($page.data.initialFutureAttendances || []);
	let futureEventsLoading = $state($page.data.futureEventCount > 0 || !$page.data.initialFutureAttendances);
	let pastAttendances: any = $state($page.data.initialPastAttendances || []);
	let pastEventsLoading = $state($page.data.pastEventCount > 0 || !$page.data.initialPastAttendances);
	let userId = $state();
	
	// Track if Triplit has synced
	let triplitSynced = $state(false);

	let activeTab = $state('about');

	// Create a map from the banners array
	const bannerUrlsMap = new Map(
		$page.data.banners.map((banner) => [banner.eventId, banner.bannerSmallSizeUrl])
	);

	// Function to get banner information by eventId
	function getBannerUrlByEventId(eventId: string) {
		const banner = bannerUrlsMap.get(eventId);
		return banner ? banner : '';
	}

	$effect(() => {
		console.log('futureAttendances', futureAttendances);
	});

	function createAttendanceQuery(client: TriplitClient, currUserID: string, future: boolean) {
		// NOTE: we add 24h so that currently happening events are still shown in the main window until 24h later
		const currentDate = new Date();
		const futureDate = new Date(currentDate.getTime() - 6 * 60 * 60 * 1000); // Add 6 hours in milliseconds

		return client
			.query('attendees')
			.Where(
				and([
					['user_id', '=', currUserID],
					['status', 'nin', [Status.LEFT, Status.REMOVED]]
				])
			)
			.Where('event.start_time', future ? '>=' : '<', futureDate.toISOString())
			.Include('event', (rel) =>
				rel('event')
					.Include('private_data', (rel) =>
						rel('private_data').Select(['num_attendees_going', 'num_temp_attendees_going'])
					)
					.Include('user', (rel) => rel('user').Select(['username']))
			)
			.Order('event.start_time', future ? 'ASC' : 'DESC');
	}

	const initEvents = async () => {
		// let pastAttendanceQuery = createAttendanceQuery(client, userId, true);
		// console.log('----> ??? ', await client.fetch(pastAttendanceQuery));
		if (dev && false) {
			console.log('all events this user can see', await client.fetch(client.query('events')));
			console.log('all users this user can see', await client.fetch(client.query('user')));
			console.log(
				'all profile_images this user can see',
				await client.fetch(client.query('profile_images'))
			);
			console.log('all attendees this user can see', await client.fetch(client.query('attendees')));
			console.log('all files this user can see', await client.fetch(client.query('files')));
			console.log(
				'all announcement this user can see',
				await client.fetch(client.query('announcement'))
			);
		}
	};

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		initEvents().catch((error) => {
			console.error('Failed to get events:', error);
		});

		let futureAttendanceQuery = createAttendanceQuery(client, $page.data.user.id, true);
		let pastAttendanceQuery = createAttendanceQuery(client, $page.data.user.id, false);

		const unsubscribeFromFutureEvents = client.subscribe(
			futureAttendanceQuery,
			(results) => {
				// Don't overwrite server data with empty array unless we're sure it's accurate
				if (results.length > 0 || $page.data.futureEventCount === 0 || triplitSynced) {
					futureAttendances = results;
				}
				futureEventsLoading = false;
				triplitSynced = true;
				// console.log('===>, futureAttendances', futureAttendances);
			},
			(error) => {
				console.error('Error fetching future attendances:', error);
				futureEventsLoading = false;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					// Mark as loading complete when remote data is fetched
					futureEventsLoading = false;
					triplitSynced = true;
				}
			}
		);

		const unsubscribeFromPastEvents = client.subscribe(
			pastAttendanceQuery,
			(results) => {
				// Don't overwrite server data with empty array unless we're sure it's accurate
				if (results.length > 0 || $page.data.pastEventCount === 0 || triplitSynced) {
					pastAttendances = results;
				}
				pastEventsLoading = false;
			},
			(error) => {
				console.error('Error fetching past attendances:', error);
				pastEventsLoading = false;
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					pastEventsLoading = false;
				}
			}
		);

		const init = async () => {
			userId = (await waitForUserId()) as string;
		};
		init();

		return () => {
			// Cleanup
			unsubscribeFromFutureEvents();
			unsubscribeFromPastEvents();
		};
	});
</script>

<PullToRefresh />

<div class="mx-4 mb-48 flex flex-col items-center justify-center sm:mb-20">
	<section class="mt-8 w-full sm:w-2/3 md:w-[700px]">
		<div class="my-4 flex w-full flex-col justify-center space-y-2">
			<SetupMeet userId={$page.data.user.id} />
		</div>
		
		<!-- Quick Actions -->
		<div class="mb-6 flex w-full justify-center gap-3">
			<Button
				variant="outline"
				class="flex-1 max-w-48"
				onclick={() => goto('/bonfire/create')}
			>
				<Plus class="w-4 h-4 mr-2" />
				Create Event
			</Button>
			<Button
				variant="outline"
				class="flex-1 max-w-48"
				onclick={() => goto('/organizations')}
			>
				<Building2 class="w-4 h-4 mr-2" />
				Organizations
			</Button>
		</div>
		
		<!-- <PermissionsPausedMsg {userId} /> -->
		<Tabs.Root value={activeTab} class="w-full">
			<div class="flex w-full justify-center">
				<Tabs.List class="mb-1 w-full bg-transparent animate-in fade-in zoom-in">
					<div class="rounded-lg bg-slate-700 p-2">
						<Tabs.Trigger value="about" class="focus:outline-none focus-visible:ring-0">
							Upcoming
						</Tabs.Trigger>
						<Tabs.Trigger value="discussions" class="focus:outline-none focus-visible:ring-0"
							>Past
						</Tabs.Trigger>
					</div>
				</Tabs.List>
			</div>
			<Tabs.Content value="about" class="mb-10 h-fit w-full">
				{#if futureEventsLoading && $page.data.futureEventCount === 0}
					<!-- Still determining if there are events -->
					<Loader />
				{:else if futureEventsLoading && $page.data.futureEventCount > 0 && !triplitSynced}
					<!-- We know there are events from server, show skeletons while loading -->
					<div class="space-y-7 sm:space-y-10">
						{#each Array($page.data.futureEventCount) as _, i}
							<EventCardSkeleton />
						{/each}
					</div>
				{:else if !futureEventsLoading && futureAttendances.length === 0}
					<!-- Confirmed no events after sync -->
					<div
						class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-200 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
					>
						<div class="flex items-center text-sm">
							<span>You currently have no upcoming events.</span>
						</div>

						<Button
							class="w-full text-sm dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
							onclick={() => location.reload()}
						>
							<DatabaseZap class="mr-2 !h-5 !w-5" /> Reload database
						</Button>
					</div>
				{:else}
					<div>
						{#each futureAttendances as attendance}
							{console.log('attendance.event.is_published', attendance.event.is_published)}
							<div class="my-7 sm:my-10">
								<EventCard
									eventId={attendance.event.id}
									eventTitle={attendance.event.title}
									eventDescription={attendance.event.description}
									eventStartTime={attendance.event.start_time}
									eventEndTime={attendance.event.end_time}
									eventLocation={attendance.event.location}
									overlayColor={attendance.event.overlay_color}
									overlayOpacity={attendance.event.overlay_opacity}
									style={attendance.event.style}
									fontStr={attendance.event.font}
									currUserId={userId}
									eventCreatorName={attendance.event.user?.username ?? ''}
									eventCreatorId={attendance.event.user_id}
									rsvpStatus={attendance.status}
									isPublished={attendance.event.is_published ?? false}
									numGuests={attendance.guest_count}
									maxNumGuestsAllowedPerAttendee={attendance.event.max_num_guests_per_attendee}
									bannerImageUrl={getBannerUrlByEventId(attendance.event.id)}
									numGoingAttendees={attendance.event?.private_data?.num_attendees_going +
										attendance.event?.private_data?.num_temp_attendees_going}
									maxCapacity={attendance.event?.max_capacity}
									isCuttoffDateEnabled={attendance.event?.is_cut_off_date_enabled}
									cuttoffDate={attendance.event?.cut_off_date}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="discussions" class="mb-2 h-fit w-full">
				{#if pastEventsLoading && $page.data.pastEventCount === 0}
					<Loader />
				{:else if pastEventsLoading && $page.data.pastEventCount > 0 && !triplitSynced}
					<!-- We know there are past events from server, show skeletons while loading -->
					<div class="space-y-7 sm:space-y-10">
						{#each Array(Math.min($page.data.pastEventCount, 3)) as _, i}
							<EventCardSkeleton />
						{/each}
					</div>
				{:else if !pastEventsLoading && pastAttendances.length === 0}
					<div
						class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-200 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
					>
						<div class="flex items-center text-sm">
							<Frown class="mr-2 !h-5 !w-5" />
							<span>No past events found.</span>
						</div>
					</div>
				{:else if pastAttendances.length > 0}
					<div>
						{#each pastAttendances as attendance}
							<div class="my-7 sm:my-10">
								<EventCard
									eventId={attendance.event.id}
									eventTitle={attendance.event.title}
									eventDescription={attendance.event.description}
									eventStartTime={attendance.event.start_time}
									eventEndTime={attendance.event.end_time}
									eventLocation={attendance.event.location}
									overlayColor={attendance.event.overlay_color}
									overlayOpacity={attendance.event.overlay_opacity}
									style={attendance.event.style}
									fontStr={attendance.event.font}
									currUserId={userId}
									eventCreatorName={attendance.event.user?.username ?? ''}
									eventCreatorId={attendance.event.user_id}
									rsvpStatus={attendance.status}
									isPublished={attendance.event.is_published ?? false}
									numGuests={attendance.guest_count}
									maxNumGuestsAllowedPerAttendee={attendance.event.max_num_guests_per_attendee}
									bannerImageUrl={getBannerUrlByEventId(attendance.event.id)}
									numGoingAttendees={attendance.event?.private_data?.num_attendees_going +
										attendance.event?.private_data?.num_temp_attendees_going}
									maxCapacity={attendance.event?.max_capacity}
									isCuttoffDateEnabled={attendance.event?.is_cut_off_date_enabled}
									cuttoffDate={attendance.event?.cut_off_date}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</section>
</div>

<!-- <div
	class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 transform flex-col items-center"
	id="create-bonfire-container"
>
	<a
		id="create-bonfire-button"
		href="/bonfire/create"
		role="button"
		aria-label="Create a Bonfire"
		class="rounded-full bg-blue-500 p-4 text-white shadow-lg transition-all duration-200 ease-in-out hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 active:bg-blue-700"
	>
		<Plus aria-hidden="true" />
	</a>
	<span
		class="mt-2 text-sm font-semibold text-black dark:text-white md:text-base"
		id="create-bonfire-label">Create a Bonfire</span
	>
</div> -->
