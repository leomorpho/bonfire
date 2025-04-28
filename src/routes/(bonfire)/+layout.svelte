<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { setTempAttendeeIdParam } from '$lib/utils';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}

	onMount(() => {
		setTempAttendeeIdParam();
	});
</script>

{@render children()}
