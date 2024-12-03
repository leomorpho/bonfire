<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}
</script>

{@render children()}
