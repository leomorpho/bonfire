<script lang="ts">
	import PasswordInput from './../../../lib/components/password-input/password-input.svelte';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { onMount } from 'svelte';
	import type { FetchOptions, TriplitClient } from '@triplit/client';
	import Loader from '$lib/components/Loader.svelte';
	import { DatabaseZap, Frown, Plus } from 'lucide-svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import Button from '$lib/components/ui/button/button.svelte';
	import PullToRefresh from '$lib/components/PullToRefresh.svelte';
	import SvgLoader from '$lib/components/SvgLoader.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	let client: TriplitClient;

	let futureAttendances: any = $state({});
	let futureEventsLoading = $state(true);
	let pastAttendances: any = $state({});
	let pastEventsLoading = $state(true);
	let userId = $state();

	let activeTab = $state('about');

	$effect(() => {
		console.log('futureAttendances', futureAttendances);
	});

	function createAttendanceQuery(client: TriplitClient, currUserID: string, future: boolean) {
		// NOTE: we add 24h so that currently happening events are still shown in the main window until 24h later
		const currentDate = new Date();
		const futureDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Add 24 hours in milliseconds

		let query = client
			.query('attendees')
			.where(['user_id', '=', currUserID])
			.where('event.start_time', future ? '>=' : '<', futureDate.toISOString());

		return query
			.subquery(
				'organizer_name',
				client.query('user').where(['id', '=', '$1.event.user_id']).select(['username']).build(),
				'one'
			)
			.include('event')
			.subquery(
				'attendees',
				client.query('attendees').where(['event_id', '=', '$1.event_id']).select(['status']).build()
			)
			.subquery(
				'temporary_attendees',
				client
					.query('temporary_attendees')
					.where(['event_id', '=', '$1.event_id'])
					.select(['status'])
					.build()
			)
			.order('event.start_time', 'DESC')
			.build();
	}

	const initEvents = async () => {
		// let pastAttendanceQuery = createAttendanceQuery(client, userId, true);
		// console.log('----> ??? ', await client.fetch(pastAttendanceQuery.build()));
		if (dev) {
			console.log(
				'all events this user can see',
				await client.fetch(client.query('events').build())
			);
			console.log('all users this user can see', await client.fetch(client.query('user').build()));
			console.log(
				'all profile_images this user can see',
				await client.fetch(client.query('profile_images').build())
			);
			console.log(
				'all attendees this user can see',
				await client.fetch(client.query('attendees').build())
			);
			console.log('all files this user can see', await client.fetch(client.query('files').build()));
			console.log(
				'all announcement this user can see',
				await client.fetch(client.query('announcement').build())
			);
		}
	};

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		initEvents().catch((error) => {
			console.error('Failed to get events:', error);
		});

		const queryOptions = {
			policy: 'local-and-remote',
			timeout: 2000 // Optional: Wait for up to 2s before showing local data
		} as FetchOptions;

		let futureAttendanceQuery = createAttendanceQuery(client, $page.data.user.id, true);
		let pastAttendanceQuery = createAttendanceQuery(client, $page.data.user.id, false);

		const unsubscribeFromFutureEvents = client.subscribe(
			futureAttendanceQuery,
			(results) => {
				futureAttendances = results;
				futureEventsLoading = false;
				console.log('===>, futureAttendances', futureAttendances);
			},
			(error) => {
				console.error('Error fetching current temporary attendee:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
			}
		);

		const unsubscribeFromPastEvents = client.subscribe(
			pastAttendanceQuery,
			(results) => {
				pastAttendances = results;
				pastEventsLoading = false;
			},
			(error) => {
				console.error('Error fetching current temporary attendee:', error);
			},
			{
				localOnly: false,
				onRemoteFulfilled: () => {}
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
	<section class="md:2/3 mt-8 w-full sm:w-2/3 md:w-[700px]">
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
				{#if futureEventsLoading}
					<!-- We don't want to show if the query is loading as it could be showing cached data that can just be refreshed seamlessy-->
					<Loader />
				{:else if futureAttendances.length == 0}
					<div
						class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-100 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
					>
						<div class="flex items-center text-sm">
							<span>You currently have no upcoming events.</span>
						</div>
						<!-- <p class="text-xs text-slate-600 dark:text-slate-300">
						This app uses a <strong>local-first database</strong>, meaning it works offline. If your
						data seems out of sync, reloading should fix it.
					</p> -->

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
							<div class="my-7 sm:my-10">
								<EventCard
									event={attendance.event}
									{userId}
									eventCreatorName={attendance.organizer_name['username']}
									rsvpStatus={attendance.status}
									isPublished={attendance.event.is_published}
									numGuests={attendance.guest_count}
									attendeesStatuses={attendance.attendees}
									temporaryAttendeesStatuses={attendance.temporary_attendees}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="discussions" class="mb-2 h-fit w-full">
				{#if pastEventsLoading}
					<div class="h-32">
						<div class="font-mono">Loading...</div>
						<SvgLoader />
					</div>
				{:else if pastAttendances.length == 0}
					<div
						class="mx-auto mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-2 space-y-5 rounded-lg bg-slate-100 p-6 text-center dark:bg-slate-800 dark:text-white sm:mt-16 sm:w-2/3"
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
									event={attendance.event}
									{userId}
									eventCreatorName={attendance.organizer_name['username']}
									rsvpStatus={attendance.status}
									isPublished={attendance.event.is_published}
									numGuests={attendance.guest_count}
									attendeesStatuses={attendance.attendees}
									temporaryAttendeesStatuses={attendance.temporary_attendees}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</section>
</div>

<div
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
</div>
