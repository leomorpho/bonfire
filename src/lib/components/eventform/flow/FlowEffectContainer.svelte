<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	let { children } = $props();
</script>

<div in:slide={{ duration: 300 }}>
	<div in:fade={{ duration: 300 }}>
		{@render children()}
	</div>
</div>
