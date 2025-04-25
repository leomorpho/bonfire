<script lang="ts">
	import { shortcut } from '$lib/jsrepo/actions/shortcut.svelte';

	let { key = 'Enter', callback } = $props();
</script>

<svelte:window
	use:shortcut={{
		key: key,
		callback: callback
	}}
/>
