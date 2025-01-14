<script lang="ts">
	import SvgLoader from './SvgLoader.svelte';

	let { show = true, text = 'Loading...' } = $props();
</script>

{#if show}
	<div
		id="svg-loader"
		class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50"
	>
		<div class="text-center">
			<div class="font-mono text-white">{text}</div>
			<SvgLoader />
		</div>
	</div>
{/if}
