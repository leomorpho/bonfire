<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { TriplitClient } from '@triplit/client';
	import SvgLoader from './SvgLoader.svelte';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import Announcement from './Announcement.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	let { maxCount = null } = $props();

	const eventId = $page.params.id;
	let announcementsSubset = $state([]);
	let allAnnouncements = $state();
	let userId = $state('');
	let announcementsLoading = $state(true);
	let totalCount = $state(0);
	let currentUserAttendeeId = $state(null);
	let isDialogOpen = $state(false);

	const createAnnouncementsQuery = (client: TriplitClient) => {
		return client
			.query('announcement')
			.where(['event_id', '=', eventId])
			.include('seen_by')
			.order('created_at', 'DESC');
	};

	const getAllAnnouncements = async () => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		allAnnouncements = await client.fetch(createAnnouncementsQuery(client).build());
		isDialogOpen = true;
		console.log('getting all announcements', allAnnouncements);
	};

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const init = async () => {
			userId = (await waitForUserId()) as string;

			const currentUserAttendee = await client.fetchOne(
				client
					.query('attendees')
					.where(['user_id', '=', userId], ['event_id', '=', eventId])
					.select(['id'])
					.build()
			);

			// console.log('---- user_id', userId);
			// console.log('---- event_id', $page.params.id);
			// console.log('---- currentUserAttendee', currentUserAttendee);
			currentUserAttendeeId = currentUserAttendee.id;

			if (maxCount) {
				// Only get total count when a subset is queried from bonfire main view
				let totalCountResults = await client.fetch(
					client.query('announcement').where(['event_id', '=', eventId]).select(['id']).build()
				);
				totalCount = totalCountResults.length;
			}
		};

		init();

		let announcementsQuery = createAnnouncementsQuery(client);

		if (maxCount) {
			announcementsQuery = announcementsQuery.limit(maxCount);
		}

		const unsubscribe = client.subscribe(
			announcementsQuery.build(),
			(results, info) => {
				announcementsSubset = results;
				announcementsLoading = false;
			},
			(error) => {
				// handle error
			},
			// Optional
			{
				localOnly: false,
				onRemoteFulfilled: () => {
					console.log('server has sent back results for the subscription');
				}
			}
		);

		return () => {
			unsubscribe;
		};
	});
</script>

{#if announcementsLoading || !currentUserAttendeeId}
	<div class="flex w-full items-center justify-center">
		<SvgLoader />
	</div>
{:else}
	<div class="space-y-3">
		{#each announcementsSubset as announcement}
			<Announcement {eventId} currUserId={userId} {announcement} {currentUserAttendeeId} />
		{/each}
		{#if totalCount > maxCount}
			<Button class="mt-3 w-full ring-glow" onclick={getAllAnnouncements}
				>See {totalCount - maxCount} more annoucements</Button
			>
			<Dialog.Root bind:open={isDialogOpen}>
				<Dialog.Content class="h-full">
					<ScrollArea>
						<Dialog.Header class="mx-4">
							<Dialog.Title>All Announcements</Dialog.Title>

							<Dialog.Description>
								{#each allAnnouncements as announcement}
									<div class="my-3">
										<Announcement
											{eventId}
											currUserId={userId}
											{announcement}
											{currentUserAttendeeId}
										/>
									</div>
								{/each}
							</Dialog.Description>
						</Dialog.Header>
					</ScrollArea>
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	</div>
{/if}
