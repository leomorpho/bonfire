<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, ImagePlus } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from '$lib/components/Rsvp.svelte';

	let client = feTriplitClient as TriplitClient;

	let userId = $state('');

	let event = $state();

	let rsvpStatus = $state('');

	onMount(() => {
		const initAsync = async () => {
			userId = (await waitForUserId()) as string;
		};
		event = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));

		initAsync().catch((error) => {
			console.error('Failed to get async data:', error);
		});
	});

	let attendeesFake = [
		{ url: 'https://github.com/shadcn.png', name: 'CN' },
		{ url: 'https://github.com/shadcn.png', name: 'AP' },
		{ url: 'https://github.com/shadcn.png', name: 'JL' },
		{ url: 'https://github.com/shadcn.png', name: 'CH' }
	];

	$effect(() => {
		// Ensure event data and userId are available
		if (event.results && event.results.length > 0 && userId) {
			console.log('##$$$$');
			// Find the current user's RSVP status in the attendees list
			const attendees = event.results[0].attendees;
			console.log(attendees);
			if (attendees && attendees.length > 0) {
				const currentUserAttendee = attendees.find((attendee) => attendee.user_id === userId);

				// Set RSVP status based on the attendee record, or keep it as default
				rsvpStatus = currentUserAttendee ? currentUserAttendee.response : 'undecided';
				console.log(rsvpStatus);
			} else {
				console.log('No attendees yet.');
			}
		}
	});
</script>

{#if !event || event.fetching}
	<Loader />
{:else if event.error}
	<p>Error: {event.error.message}</p>
{:else if event.results}
	<div class="mx-4 flex flex-col items-center justify-center">
		<section class="mt-8 w-full sm:w-[450px]">
			{#if event.results[0].user_id == (userId as string)}
				<a class="flex w-full justify-center" href={`/bonfire/${$page.params.id}/update`}>
					<Button variant="outline" class="m-2 rounded-full">
						<Cog class="h-5 w-5" />
					</Button>
				</a>
			{/if}
			<h1 class="my-5 text-xl">{event.results[0].title}</h1>
			<div class="font-medium">{formatHumanReadable(event.results[0].start_time)}</div>
			<div class="font-light">{event.results[0].location}</div>
			<div>
				<div class="mt-5 flex -space-x-4">
					<!-- {#each attendees.results as attendee} -->
					{#each attendeesFake as attendee}
						<Avatar.Root>
							<Avatar.Image src={attendee.url} alt="@shadcn" />
							<Avatar.Fallback>{attendee.name}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</div>
			<Rsvp value={rsvpStatus}/>

			<Button class="mt-4 flex w-full items-center justify-center">
				<Share class="h-5 w-5" />
				Share Bonfire</Button
			>
			<div class="my-10">
				{event.results[0].description}
			</div>
			<hr class="my-10" />
			<div>
				<div class="my-10">
					<div>Images</div>
					<Button variant="outline" class="flex w-full items-center justify-center"
						><ImagePlus />Add to gallery</Button
					>
				</div>
				<div>Comments</div>
			</div>
		</section>
	</div>
{/if}
