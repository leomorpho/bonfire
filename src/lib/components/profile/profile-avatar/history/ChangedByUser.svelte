<script lang="ts">
	import { usersLiveDataStore } from '$lib/profilestore';
	import { onMount } from 'svelte';

	let { userId } = $props();

	let username = $state();

	onMount(() => {
		const unsubscribe = usersLiveDataStore.subscribe((users) => {
			const user = users[userId];
			username = user.username ?? "N/A";
		});
		return () => {
			unsubscribe();
		};
	});
</script>

{#if username}
	{username}
{/if}
