<script lang="ts">
	import Button from '../ui/button/button.svelte';

	let { numGuests = 0 } = $props();
</script>

<Button>
	{#if numGuests}
		You're currently bringing {numGuests} guests.
	{:else}
		Bring guests
	{/if}
</Button>
