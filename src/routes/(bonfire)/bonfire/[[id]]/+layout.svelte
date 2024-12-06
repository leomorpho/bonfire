<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { parseColor, styleStore } from '$lib/styles';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles: string = $state('');
	let overlayColor: string = $state('');
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
		overlayColor = styleData?.overlay_color;
		overlayOpacity = styleData?.overlay_opacity;
		styleStore.set(styleData?.style || '');
		console.log('styles', styles);
	});

	// Reactive statement to calculate the background color style
	let overlayStyle = $derived(`background-color: rgba(${parseColor(
		overlayColor
	)}, ${overlayOpacity});`);
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div style={overlayStyle}>
		{@render children()}
	</div>
</div>
