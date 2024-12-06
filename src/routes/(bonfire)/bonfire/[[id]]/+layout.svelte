<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';
	import { styleStore } from '$lib/styles';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles: string = $state();
	let overlayStyles: string = $state();
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
			.select(['style', 'overlay_style'])
			.build();
		styleData = await client.fetchOne(styleDataQuery);
		styles = typeof styleData?.style === 'string' ? styleData.style : '';
		overlayStyles = typeof styleData?.overlay_style === 'string' ? styleData.overlay_style : '';
		styleStore.set(styleData?.style || '');
		console.log('styles', styles);
	});
</script>

<div class="bg-color min-h-screen w-full" style={styles}>
	<div style="background-color: rgba(0, 0, 0, 0.5);">
		{@render children()}
	</div>
</div>
