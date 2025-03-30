<script lang="ts">
	import { tempUsersLiveDataStore } from '$lib/profilestore';
	import { onMount } from 'svelte';

	let { tempAttendeeId } = $props();

	let tempAttendeeUsername = $state();

	onMount(() => {
		const unsubscribe = tempUsersLiveDataStore.subscribe((tempUsers) => {
			const tempAttendee = tempUsers.get(tempAttendeeId);
			tempAttendeeUsername = tempAttendee?.username ?? 'N/A';
		});

		return () => {
			unsubscribe();
		};
	});
</script>

{#if tempAttendeeUsername}
	{tempAttendeeUsername}
{/if}
