<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let { url, fallbackName, username } = $props();
</script>

<Popover.Root>
	<Popover.Trigger
		><Avatar.Root>
			<Avatar.Image src={url} alt={username} />
			<Avatar.Fallback>{fallbackName.slice(0, 2)}</Avatar.Fallback>
		</Avatar.Root>
	</Popover.Trigger>
	<Popover.Content class="flex items-center justify-center">{username}</Popover.Content>
</Popover.Root>
