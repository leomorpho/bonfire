<script lang="ts">
	import { TriplitClient } from '@triplit/client';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { getFeTriplitClient } from '$lib/triplit';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let styles = $state();
	let client: TriplitClient = $state();
	let styleData = $state();

	onMount(async () => {
		client = getFeTriplitClient($page.data.jwt);
		const styleDataQuery = client
			.query('events')
			.where(['id', '=', $page.params.id])
			.select(['style'])
			.build();
		styleData = await client.fetchOne(styleDataQuery);
		console.log('styleData', styleData);
		styles = styleData?.styles || {};
	});

	function generateDynamicStyle(styles) {
		if (!styles) {
			return;
		}
		return Object.entries(styles)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	}
</script>

<div class="bg-color min-h-screen w-full" style={generateDynamicStyle(styles)}>
	{@render children()}
</div>
