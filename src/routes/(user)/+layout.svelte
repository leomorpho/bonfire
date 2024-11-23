<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { feTriplitClient, userIdStore } from '$lib/triplit';
	import type { TriplitClient } from '@triplit/client';
	import { onMount } from 'svelte';

	userIdStore.set($page.data.user.id);

	let client = feTriplitClient as TriplitClient;

	onMount(() => {
		const init = async () => {
			const query = client.query('user').where('id', '=', $page.data.user.id).build();
			let result = await client.fetch(query);

			if (result.length == 0) {
				await client.insert('user', { id: $page.data.user.id, username: '' });
				result = await client.fetch(query);
			}
			if (result[0].username.length == 0) {
				goto('profile/username');
			}
		};

		init();
	});
</script>

<slot />
