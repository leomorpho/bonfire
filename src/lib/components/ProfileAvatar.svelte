<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	let { url, fullsizeUrl = null, fallbackName ="", username } = $props();


</script>

<Popover.Root>
	<Popover.Trigger
		><Avatar.Root class="w-12 h-12 sm:w-14 sm:h-14">
			<Avatar.Image src={url} alt={username} />
			<Avatar.Fallback>{fallbackName.slice(0, 2)}</Avatar.Fallback>
		</Avatar.Root>
	</Popover.Trigger>
	<Popover.Content class="flex flex-col items-center justify-center"
		>
		<div class="mb-2 sm:mb-3 font-semibold text-xl">{username}</div>
		<Avatar.Root class="h-full w-full">
			<Avatar.Image src={fullsizeUrl ? fullsizeUrl : url} alt={username} />
			<Avatar.Fallback>{fallbackName.slice(0, 2)}</Avatar.Fallback>
		</Avatar.Root>
	</Popover.Content>
</Popover.Root>
