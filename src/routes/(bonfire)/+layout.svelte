<script lang="ts">
	import { page } from '$app/stores';
	import { userIdStore } from '$lib/triplit';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { derived } from 'svelte/store';
	import { tempAttendeeIdStore, tempAttendeeIdUrlParam } from '$lib/enums';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}

	onMount(() => {
		// Retrieve the tempAttendeeId value
		const tempAttendeeId = tempAttendeeIdStore.get();

		if (tempAttendeeId) {
			const observer = new MutationObserver(() => {
				// Modify all <a> links on the page
				const links = document.querySelectorAll<HTMLAnchorElement>('a');
				links.forEach((link) => {
					const url = new URL(link.href, window.location.origin);

					// Check if the link is internal and doesn't already have the parameter
					if (
						url.origin === window.location.origin &&
						!url.searchParams.has(tempAttendeeIdUrlParam)
					) {
						url.searchParams.set(tempAttendeeIdUrlParam, tempAttendeeId);
						link.href = url.toString(); // Update the href attribute
					}
				});
			});

			// Observe the entire document for DOM changes
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			// Cleanup when the component is destroyed
			return () => observer.disconnect();
		}
	});
</script>

{@render children()}
