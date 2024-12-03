<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { TriplitClient } from '@triplit/client';
	import { useQuery } from '@triplit/svelte';
	import SvgLoader from './SvgLoader.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatHumanReadable } from '$lib/utils';
	import Button from './ui/button/button.svelte';
	import { onMount } from 'svelte';
	import { Pencil } from 'lucide-svelte';

	let { eventId, currUserId, maxCount, allAnnoucementsURL = '' } = $props();

	let client = getFeTriplitClient($page.data.jwt) as TriplitClient;

	let totalCount = $state(0);

	let announcementsQuery = client
		.query('announcement')
		.where(['event_id', '=', eventId])
		.order('created_at', 'DESC');

	if (maxCount) {
		announcementsQuery = announcementsQuery.limit(maxCount);
	}

	let announcements = useQuery(client, announcementsQuery);

	onMount(() => {
		const init = async () => {
			let totalCountResults = await client.fetch(
				client.query('announcement').where(['event_id', '=', eventId]).select(['id']).build()
			);
			totalCount = totalCountResults.length;
		};

		init();
	});
</script>

{#if !announcements || announcements.fetching}
	<SvgLoader />
{:else if announcements.error}
	<p>Error: {announcements.error.message}</p>
{:else if announcements.results}
	{console.log('announcements', announcements.results)}
	<div class="space-y-3">
		{#each announcements.results as announcement}
			<Card.Root class="announcement">
				<Card.Header>
					<Card.Title>{announcement.content}</Card.Title>
					<Card.Description
						><div class="font-medium">
							{formatHumanReadable(announcement.created_at)}
						</div></Card.Description
					>
				</Card.Header>
				<Card.Footer>
					{#if currUserId == announcement.user_id}
						<a href={`/bonfire/${eventId}/announcement/${announcement.id}/update`}
							><Button class="mt-2 rounded-xl" variant="outline"><Pencil class="h-4 w-4" /></Button
							></a
						>
					{/if}
				</Card.Footer>
			</Card.Root>
		{/each}
		{#if totalCount > maxCount}
			<a href={allAnnoucementsURL}>
				<Button class="mt-3 w-full">See {totalCount - maxCount} more annoucements</Button>
			</a>
		{/if}
	</div>
{/if}
