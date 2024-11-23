<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from './Rsvp.svelte';

	let { event, userId } = $props();

	let rsvpStatus = event.attendees[0];

	let rsvpCanBeChanged = new Date(event.start_time) >= new Date();

	console.log(event.start_time);
</script>

<a href={`/bonfire/${event.id}`}>
	<Card.Root class="my-4 w-full bg-slate-100">
		<Card.Header>
			<Card.Title class="text-lg">{event.title}</Card.Title>
			<Card.Description>{formatHumanReadable(event.start_time)}</Card.Description>
			<Card.Description>Hosted by {event.user?.username }</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<Rsvp attendance={rsvpStatus} {userId} eventId={event.id} {rsvpCanBeChanged} />
		</Card.Content>
		{#if event.user_id == (userId as string)}
			<a href={`/bonfire/${event.id}/update`}>
				<Button variant="outline" class="m-2 rounded-full">
					<Cog class="h-5 w-5" />
				</Button>
			</a>
		{/if}
	</Card.Root>
</a>
