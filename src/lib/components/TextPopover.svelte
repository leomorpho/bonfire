<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';

	let { children, text } = $props();
</script>

<Popover.Root>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>
	<Popover.Content>{text}</Popover.Content>
</Popover.Root>
