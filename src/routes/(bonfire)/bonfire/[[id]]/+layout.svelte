<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { overlayColorStore, overlayOpacityStore, parseColor, styleStore } from '$lib/styles';
	import { tempAttendeeSecretStore, tempAttendeeSecretParam } from '$lib/enums';
	import { get } from 'svelte/store';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles: string = $state('');
	let overlayColor: string = $state('#000000');
	let overlayOpacity: number = $state(0.5);
	let client: TriplitClient = $state();
	let styleData = $state();

	// Subscribe to the stores for reactive updates, this allows updating the styles
	// on the event page when redirected from the update page.
	styleStore.subscribe((value) => {
		styles = value;
	});
	overlayColorStore.subscribe((value) => {
		overlayColor = value;
	});
	overlayOpacityStore.subscribe((value) => {
		overlayOpacity = value;
	});

	// Access the `temp` parameter from the query string
	let tempAttendeeSecret: string | null = $state(null);

	// Use a reactive statement to react to changes in the `$page` store
	const url = $page.url;
	tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	onMount(async () => {
		if (tempAttendeeSecret) {
			tempAttendeeSecretStore.set(tempAttendeeSecret);
		} else {
			tempAttendeeSecret = get(tempAttendeeSecretStore);
		}
		
		if ($page.data.user || tempAttendeeSecret) {
			// User is logged in
			client = getFeTriplitClient($page.data.jwt);
			const styleDataQuery = client
				.query('events')
				.where(['id', '=', $page.params.id])
				.select(['style', 'overlay_color', 'overlay_opacity'])
				.build();

			styleData = await client.fetchOne(styleDataQuery);
			styles = typeof styleData?.style === 'string' ? styleData.style : '';
			overlayColor = styleData?.overlay_color ?? '#000000';
			overlayOpacity = styleData?.overlay_opacity ?? 0.5;
			styleStore.set(styleData?.style || '');
			overlayColorStore.set(overlayColor);
			overlayOpacityStore.set(overlayOpacity);
		} else {
			// If user is not logged in, it's the responsibility of BE to return the proper event object for anonymous and unverified users
			styles = $page.data.event.style ?? '';
			overlayColor = $page.data.event?.overlay_color ?? '#000000';
			overlayOpacity = $page.data.event?.overlay_opacity ?? 0.5;
		}

		console.log('styles', styles);
		console.log('overlayColor', overlayColor);
		console.log('overlayOpacity', overlayOpacity);
	});

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});`
	);
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div class="bg-overlay min-h-screen" style={overlayStyle}>
		{@render children()}
	</div>
</div>
