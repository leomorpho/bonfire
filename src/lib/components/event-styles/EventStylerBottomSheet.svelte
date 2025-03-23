<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Palette } from 'lucide-svelte';
	import { randomSort, stylesGallery } from '$lib/styles';
	import { onMount } from 'svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import type { TriplitClient } from '@triplit/client';
	import { toast } from 'svelte-sonner';
	import SvgLoader from '../SvgLoader.svelte';
	import EventStyler from './EventStyler.svelte';

	let { eventId } = $props();

	if (!eventId) {
		throw new Error('eventId is required');
	}

	let isSheetOpen = $state(false);
	let eventData: any = $state();
	let client: TriplitClient;
	let loading = $state(false);

	const toggleSheet = () => {
		isSheetOpen = !isSheetOpen;
	};


	// Preview or final target
	let currentTargetSelector = 'bg-color'; // Default to preview
	let bgOverlaySelector = 'bg-overlay';

	onMount(() => {
		client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;

		const unsubscribe = client.subscribe(
			client
				.query('events')
				.where(['id', '=', eventId])
				.select(['style', 'overlay_color', 'overlay_opacity'])
				.build(),
			(results) => {
				if (results.length > 0) {
					eventData = results[0];
					loading = false;
				} else {
					console.error('failed to load event styling info');
					toast.error('Sorry, we failed to load your event styling info');
				}
			},
			(error) => {
				console.error('Error fetching data:', error);
				loading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

<Button onclick={toggleSheet} variant="outline" class="m-2 rounded-full">
	<Palette class="h-5 w-5" />
</Button>

{#if isSheetOpen}
	<div
		class="fixed inset-x-0 bottom-0 z-50 h-1/2 transform rounded-t-lg bg-white shadow-lg transition-transform duration-300 dark:bg-black"
		transition:fly={{ y: 300, duration: 300 }}
	>
		<div class="p-1 px-3 h-full">
			{#if loading}
				<div class="flex w-full h-full justify-center"><SvgLoader /></div>
			{:else}
				<div class="relative h-full">
					<EventStyler
						finalStyleCss={eventData?.style}
						overlayColor={eventData?.overlay_color}
						overlayOpacity={eventData?.overlay_opacity}
						{currentTargetSelector}
						{bgOverlaySelector}
                        horizontalScroll={true}
					/>
				</div>
			{/if}
			<div class="mt-4 flex w-full justify-center space-x-2">
				<Button onclick={toggleSheet} class="bg-green-500 hover:bg-green-400">Save changes</Button>
				<Button onclick={toggleSheet}>Cancel</Button>
			</div>
		</div>
	</div>
{/if}
