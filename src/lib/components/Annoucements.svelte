<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient, waitForUserId } from '$lib/triplit';
	import { TriplitClient } from '@triplit/client';
	import { useQuery } from '@triplit/svelte';
	import SvgLoader from './SvgLoader.svelte';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import Announcement from './Announcement.svelte';

	let { maxCount = null, allAnnoucementsURL = '' } = $props();

	const eventId = $page.params.id;
	let announcements = $state([]);
	let userId = $state('');
	let announcementsLoading = $state(true);
	let totalCount = $state(0);
	let currentUserAttendeeId = $state(null);

	onMount(() => {
		let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

		const init = async () => {
			console.log('in init');
			userId = (await waitForUserId()) as string;

			const currentUserAttendee = await client.fetch(
				client
					.query('attendees')
					.where(['user_id', '=', userId], ['event_id', '=', eventId])
					.select(['id'])
					.build()
			);
			// if ('nNUhjlOr13pgCncyJQn0R' == eventId) {
			// 	console.log('equal');
			// } else {
			// 	console.log('not equal');
			// }

			console.log('---- user_id', userId);
			console.log('---- event_id', $page.params.id);
			console.log('---- currentUserAttendee', currentUserAttendee);
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

		let announcementsQuery = client
			.query('announcement')
			.where(['event_id', '=', eventId])
			.include('seen_by')
			.order('created_at', 'DESC');

		if (maxCount) {
			announcementsQuery = announcementsQuery.limit(maxCount);
		}

		const unsubscribe = client.subscribe(
			announcementsQuery.build(),
			(results, info) => {
				announcements = results;
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

{#if announcementsLoading}
	<SvgLoader />
{:else}
	{console.log('sub announce', announcements)}
	{console.log('# currentUserAttendeeId', currentUserAttendeeId)}
	<div class="space-y-3">
		{#each announcements as announcement}
			<Announcement {eventId} currUserId={userId} {announcement} {currentUserAttendeeId} />
		{/each}
		{#if totalCount > maxCount}
			<a href={allAnnoucementsURL}>
				<Button class="mt-3 w-full ring-glow">See {totalCount - maxCount} more annoucements</Button>
			</a>
		{/if}
	</div>
{/if}
