<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ShieldHalf } from 'lucide-svelte';

	let { text, class: className = null } = $props();
</script>

<Popover.Root>
	<Popover.Trigger class={className}>
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400 dark:bg-purple-600 text-white">
			<ShieldHalf class="h-5 w-4" />
		</div>
	</Popover.Trigger>
	<Popover.Content class="flex text-center">{text}</Popover.Content>
</Popover.Root>
