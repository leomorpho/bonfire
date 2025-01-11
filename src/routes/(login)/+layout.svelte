<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { setTempAttendeeIdParam } from '$lib/utils';

	let { children }: { data: LayoutData; children: Snippet } = $props();

	onMount(() => {
		setTempAttendeeIdParam();
	});
</script>

{@render children()}
