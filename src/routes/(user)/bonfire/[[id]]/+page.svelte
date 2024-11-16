<script lang="ts">
	import { page } from '$app/stores';
	import { useQuery } from '@triplit/svelte';
	import { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';
	import { feTriplitClient, waitForUserId } from '$lib/triplit';
	import Loader from '$lib/components/Loader.svelte';
	import { format } from 'date-fns';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog, Share, ImagePlus } from 'lucide-svelte';

	let client = feTriplitClient as TriplitClient;

	let userId = '';

	let event;
	let attendees;

	onMount(() => {
		const initAsync = async () => {
			userId = (await waitForUserId()) as string;
		};

		event = useQuery(client, client.query('events').where(['id', '=', $page.params.id]));
		attendees = useQuery(
			client,
			client.query('attendees').where(['event_id', '=', $page.params.id])
		);

		initAsync().catch((error) => {
			console.error('Failed to get async data:', error);
		});
	});

	function formatHumanReadable(date: Date): string {
		return format(date, "MMMM d, yyyy 'at' h:mma"); // Convert "AM/PM" to "am/pm"
	}

	let attendeesFake = [
		{ url: 'https://github.com/shadcn.png', name: 'CN' },
		{ url: 'https://github.com/shadcn.png', name: 'AP' },
		{ url: 'https://github.com/shadcn.png', name: 'JL' },
		{ url: 'https://github.com/shadcn.png', name: 'CH' }
	];
</script>

{#if !event || event.fetching}
	<Loader />
{:else if event.error}
	<p>Error: {event.error.message}</p>
{:else if event.results}
	<div class="mx-4 flex flex-col items-center justify-center">
		<section class="mt-8 w-full sm:w-[450px]">
			{#if event.results[0].user_id == (userId as string)}
				<a class="w-full flex justify-center" href={`/bonfire/${$page.params.id}/update`}>
					<Button variant="outline" class="m-2 rounded-full">
						<Cog class="h-5 w-5" />
					</Button>
				</a>
			{/if}
			<h1 class="text-xl my-5">{event.results[0].title}</h1>
			<div class="font-medium">{formatHumanReadable(event.results[0].start_time)}</div>
			<div class="font-light">{event.results[0].location}</div>
			<div>
				{#if !attendees || attendees.fetching}
					<div>Loading attendees...</div>
				{:else if attendees.error}
					<p>Error: {attendees.error.message}</p>
				{:else if attendees.results}
					<div class="mt-5 flex -space-x-4">
						<!-- {#each attendees.results as attendee} -->
						{#each attendeesFake as attendee}
							<Avatar.Root>
								<Avatar.Image src={attendee.url} alt="@shadcn" />
								<Avatar.Fallback>{attendee.name}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</div>
				{/if}
			</div>
			<Button variant="outline" class="mt-4 flex w-full items-center justify-center">RSVP</Button>

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
