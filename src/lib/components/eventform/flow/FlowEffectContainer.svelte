<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	let { children } = $props();
</script>

<div in:slide={{ duration: 300 }} class="w-full">
	<div in:fade={{ duration: 300 }}  class="w-full">
		{@render children()}
	</div>
</div>
