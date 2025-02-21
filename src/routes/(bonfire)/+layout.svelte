<script lang="ts">
	import { page } from '$app/stores';
	import { getFeTriplitClient, userIdStore } from '$lib/triplit';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { setTempAttendeeIdParam } from '$lib/utils';
	import { goto } from '$app/navigation';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	if ($page.data.user) {
		userIdStore.set($page.data.user.id);
	}

	onMount(() => {
		setTempAttendeeIdParam();

		const enforceUserHasUsername = async () => {
			const client = getFeTriplitClient($page.data.jwt);

			const user = await client.fetchOne(
				client.query('user').where(['id', '=', $page.data.user.id]).build()
			);
			if (user && !user.username) {
				goto('/profile/username');
			}
		};
		if ($page.data.user) {
			enforceUserHasUsername();
		}
	});
</script>

{@render children()}
