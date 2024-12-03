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
		styles = styleData?.style || {};
		console.log('styles', styles);
	});
</script>

<div class="bg-color min-h-screen w-full">
	{@render children()}
</div>

<!-- Dynamically inject the style tag -->
{@html styles}