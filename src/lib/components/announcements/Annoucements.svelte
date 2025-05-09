<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { TriplitClient } from '@triplit/client';
	import SvgLoader from '../SvgLoader.svelte';
	import Button from '../ui/button/button.svelte';
	import { onMount } from 'svelte';
	import Announcement from './Announcement.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import BonfireNoInfoCard from '../BonfireNoInfoCard.svelte';
	import { Megaphone, Plus } from 'lucide-svelte';

	let {
		rsvpStatus,
		maxCount = null,
		isUnverifiedUser = false,
		isCurrenUserEventAdmin = false,
		eventNumAnnouncements = 0
	} = $props();

	const eventId = $page.params.id;
	let announcementsSubset = $state([]);
	let allUnreadNotifications: any = $state();
	let userId = $state('');
	let notificationsLoading = $state(true);
	let totalCount = $state(0);
	let currentUserAttendeeId = $state(null);
	let isDialogOpen = $state(false);

	const createAnnouncementsQuery = (client: TriplitClient) => {
		return client
			.query('announcement')
			.Where(['event_id', '=', eventId])
			.Include('seen_by')
			.Order('created_at', 'DESC');
	};

	const getAllAnnouncements = async () => {
		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		allUnreadNotifications = await client.fetch(createAnnouncementsQuery(client));
		isDialogOpen = true;
		console.log('getting all announcements', allUnreadNotifications);
	};

	onMount(() => {
		let client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const init = async () => {
			if ($page.data.user) {
				userId = (await waitForUserId()) as string;

				const currentUserAttendee = await client.fetchOne(
					client
						.query('attendees')
						.Where(['user_id', '=', userId], ['event_id', '=', eventId])
						.Select(['id'])
				);

				// console.log('---- user_id', userId);
				// console.log('---- event_id', $page.params.id);
				// console.log('---- currentUserAttendee', currentUserAttendee);

				if (currentUserAttendee) {
					currentUserAttendeeId = currentUserAttendee.id;
				}
			}

			if (maxCount) {
				// Only get total count when a subset is queried from bonfire main view
				let totalCountResults = await client.fetch(
					client.query('announcement').Where(['event_id', '=', eventId]).Select(['id'])
				);
				totalCount = totalCountResults.length;
			}
		};

		init();

		let announcementsQuery = createAnnouncementsQuery(client);

		if (maxCount) {
			announcementsQuery = announcementsQuery.Limit(maxCount);
		}

		const unsubscribe = client.subscribe(
			announcementsQuery,
			(results) => {
				announcementsSubset = results;
				// console.log('announcementsSubset ====>', announcementsSubset);
				notificationsLoading = false;
			},
			(error) => {
				// handle error
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					// console.log('server has sent back results for the subscription');
				}
			}
		);

		return () => {
			unsubscribe;
		};
	});

	const numAnnouncementsAnonView = `${eventNumAnnouncements} ${eventNumAnnouncements == 1 ? 'announcement' : 'announcements'}`;
</script>

<div class="flex w-full justify-between rounded-xl bg-white p-2 dark:bg-slate-900">
	<div></div>
	<div class="flex items-center font-semibold">
		<Megaphone class="mr-2 !h-5 !w-5 shrink-0" />
		Announcements
	</div>
	{#if isCurrenUserEventAdmin}
		<div class="flex items-center">
			{@render createAnnouncementButton()}
		</div>
	{:else}
		<div></div>
	{/if}
</div>

{#if rsvpStatus}
	<!--Only show always for admins, but for non-admins, if there are no announcements, hide entirely?-->
	<div class="my-2">
		{@render announcements()}
	</div>
{:else}
	<div class="my-2">
		<BonfireNoInfoCard text={numAnnouncementsAnonView} />
	</div>
{/if}

{#snippet announcements()}
	{#if notificationsLoading}
		<div class="flex w-full items-center justify-center">
			<SvgLoader />
		</div>
	{:else}
		<div class="space-y-2">
			{#if totalCount > 0}
				{#each announcementsSubset as announcement}
					<Announcement
						{eventId}
						currUserId={userId}
						{announcement}
						{currentUserAttendeeId}
						{isUnverifiedUser}
						{isCurrenUserEventAdmin}
					/>
				{/each}
				{#if totalCount > maxCount}
					<Button
						class="mt-3 w-full ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
						onclick={getAllAnnouncements}>See {totalCount - maxCount} more annoucements</Button
					>
					<Dialog.Root bind:open={isDialogOpen}>
						<Dialog.Content class="h-full sm:h-[90vh]">
							<ScrollArea>
								<Dialog.Header class="mx-4">
									<Dialog.Title>All Announcements</Dialog.Title>

									<Dialog.Description>
										{#each allUnreadNotifications as announcement}
											<div class="my-3">
												<Announcement
													{eventId}
													currUserId={userId}
													{announcement}
													{currentUserAttendeeId}
													{isUnverifiedUser}
													{isCurrenUserEventAdmin}
												/>
											</div>
										{/each}
									</Dialog.Description>
								</Dialog.Header>
							</ScrollArea>
						</Dialog.Content>
					</Dialog.Root>
				{/if}
			{:else}
				<BonfireNoInfoCard
					text={'No announcements yet. Turn on your notifications to receive them.'}
				/>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet createAnnouncementButton()}
	<a href="announcement/create">
		<Button
			id="create-announcement-btn"
			class="flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
		>
			<Plus />
		</Button>
	</a>
{/snippet}
