<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import { fade } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	let { ref = $bindable(null), duration = 200, children, ...restProps } = $props();
</script>

<Collapsible.Content forceMount bind:ref {...restProps}>
	{#snippet child({ props, open })}
		{#if open}
			<div {...props} transition:fade={{ duration }}>
				{@render children?.()}
			</div>
		{/if}
	{/snippet}
</Collapsible.Content>
