<script lang="ts">
	import * as HoverCard from '$lib/components/ui/hover-card/index.js';

	let { children, explanation } = $props();
</script>

<HoverCard.Root>
	<HoverCard.Trigger>{@render children()}</HoverCard.Trigger>
	<HoverCard.Content>
		{explanation}
	</HoverCard.Content>
</HoverCard.Root>
