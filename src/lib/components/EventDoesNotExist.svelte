<script lang="ts">
	// Any TypeScript logic can go here if needed

	import CenterScreenMessage from './CenterScreenMessage.svelte';

	const message = 'Oups, this event does not exist, or it might have been deleted 🥵';
</script>

<CenterScreenMessage {message} />
