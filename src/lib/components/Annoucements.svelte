<script lang="ts">
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
	import { TriplitClient } from '@triplit/client';
	import SvgLoader from './SvgLoader.svelte';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import Announcement from './Announcement.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import BonfireNoInfoCard from './BonfireNoInfoCard.svelte';

	let { maxCount = null, isUnverifiedUser = false, isCurrenUserEventAdmin = false } = $props();

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
</script>

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
				<Button class="mt-3 w-full ring-glow dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white" onclick={getAllAnnouncements}
					>See {totalCount - maxCount} more annoucements</Button
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
			<BonfireNoInfoCard text={'No announcements yet'} />
		{/if}
	</div>
{/if}
