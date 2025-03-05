<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Cog } from 'lucide-svelte';
	import { formatHumanReadable } from '$lib/utils';
	import Rsvp from './Rsvp.svelte';
	import { parseColor } from '$lib/styles';

	let { event, userId, eventCreatorName, rsvpStatus, isPublished = true } = $props();

	let rsvpCanBeChanged = new Date(event.start_time) >= new Date();
	let overlayColor = event.overlay_color ?? '#000000';
	let overlayOpacity = event.overlay_opacity ?? 0.5;

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});`
	);
</script>

<a href={`/bonfire/${event.id}`} class="event-card animate-fadeIn">
	<Card.Root class="relative my-4 w-full bg-slate-100 dark:bg-slate-900" style={event.style}>
		<!-- Not Published Marker -->
		{#if !isPublished}
			<div class="z-20 absolute top-2 right-2 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-md dark:bg-red-500">
				Not Published
			</div>
		{/if}
		<!-- Overlay -->
		<div style={overlayStyle} class="pointer-events-none absolute inset-0 rounded-xl"></div>

		<!-- Content -->
		<div class="relative z-10 p-4">
			<Card.Header class="rounded-xl bg-slate-100 pb-2 dark:bg-slate-900 sm:mb-4">
				<Card.Title class="text-lg">{event.title}</Card.Title>
				<Card.Description>{formatHumanReadable(event.start_time)}</Card.Description>
				<Card.Description>Hosted by {eventCreatorName}</Card.Description>
			</Card.Header>
			<Card.Content>
				<Rsvp {rsvpStatus} {userId} eventId={event.id} {rsvpCanBeChanged} isAnonymousUser={false} />
			</Card.Content>
			{#if event.user_id == (userId as string)}
				<a href={`/bonfire/${event.id}/update`}>
					<Button variant="outline" class="m-2 rounded-full">
						<Cog class="h-5 w-5" />
					</Button>
				</a>
			{/if}
		</div>
	</Card.Root>
</a>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fadeIn {
		animation: fadeIn 0.3s ease-out;
	}
</style>
