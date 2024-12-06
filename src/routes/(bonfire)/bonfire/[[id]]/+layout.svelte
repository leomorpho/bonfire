<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { overlayColorStore, overlayOpacityStore, parseColor, styleStore } from '$lib/styles';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles: string = $state('');
	let overlayColor: string = $state('#000000');
	let overlayOpacity: number = $state(0);
	let client: TriplitClient = $state();
	let styleData = $state();

	// Subscribe to the store for reactive updates
	styleStore.subscribe((value) => {
		styles = value;
	});

	onMount(async () => {
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

		console.log('styles', styles);
		console.log('overlayColor', overlayColor);
		console.log('overlayOpacity', overlayOpacity);
	});

	let overlayStyle = $derived(
		`background-color: rgba(var(--overlay-color-rgb, ${parseColor(overlayColor)}), ${overlayOpacity});`
	);
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<!-- <div style={overlayStyle}> -->
	{@render children()}
	<!-- </div> -->
</div>
