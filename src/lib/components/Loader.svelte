<script lang="ts">
	import SvgLoader from './SvgLoader.svelte';

	let { show = true } = $props();
</script>

{#if show}
	<div class="flex h-80 w-full items-center justify-center">
		<div>
			<div class="font-mono">Loading...</div>
			<SvgLoader />
		</div>
	</div>
{/if}
