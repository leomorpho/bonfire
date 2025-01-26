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

	if ($page.data.event) {
		styleStore.set($page.data.event.style ?? '');
		overlayColorStore.set($page.data.event.overlay_color ?? '');
		overlayOpacityStore.set($page.data.event.overlay_opacity ?? '');
	} else {
		styleStore.set(`
    --background-color: #e5e5f7;
    --primary-color: #444cf7;
    --circle-size: 15px; /* Size of the repeating radial pattern */
    --opacity-level: 1;
    background-color: var(--background-color);
    opacity: var(--opacity-level);
    background-image: 
        radial-gradient(circle at center center, var(--primary-color), var(--background-color)),
        repeating-radial-gradient(circle at center center, var(--primary-color), var(--primary-color), var(--circle-size), transparent calc(var(--circle-size) * 2), transparent var(--circle-size));
    background-blend-mode: multiply;
        `);
		overlayColorStore.set('#000000');
		overlayOpacityStore.set(0.2);
	}

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
			if (styleData) {
				styles = typeof styleData?.style ?? '';
				overlayColor = styleData?.overlay_color ?? '#000000';
				overlayOpacity = styleData?.overlay_opacity ?? 0.5;
				styleStore.set(styleData?.style || '');
				overlayColorStore.set(overlayColor);
				overlayOpacityStore.set(overlayOpacity);
			}
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
