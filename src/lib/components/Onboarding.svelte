<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';

	let { userId = null } = $props();

	onMount(() => {
		const init = async () => {
			if (!userId) return;

			const client = getFeWorkerTriplitClient($page.data.jwt) as TriplitClient;
			const user = await client.fetchById('user', userId);
			// console.log('-----> user', user);

			if (!user?.username) {
				goto('/profile/username');
				return;
			}
			if (!user?.is_fully_onboarded) {
				goto('/onboarding/permissions');
				return;
			}
		};

		init();
	});
</script>
