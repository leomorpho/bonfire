<script lang="ts">
	import { page } from '$app/stores';
	import { feTriplitClient, userIdStore } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';

	userIdStore.set($page.data.user.id);

	let client = feTriplitClient as TriplitClient;

	onMount(() => {
		const init = async () => {
			const query = client.query('user').where('id', '=', $page.data.user.id).build();
			const result = await client.fetch(query, { policy: 'local-and-remote' });

			if (result.length == 0) {
				await client.insert('user', { id: $page.data.user.id, username: '' });
			}
		};

		init();
	});
</script>

<slot />
