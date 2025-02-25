<script lang="ts">
	import { formatHumanReadableWithContext } from '$lib/utils';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	let { username, content, created_at, deleted_by_user_id } = $props();
</script>

<div
	class="leading-1.5 flex max-h-[200px] w-full max-w-[320px]
			flex-col overflow-hidden rounded-s-xl rounded-se-xl bg-blue-100 p-4 dark:bg-blue-600"
>
	<ScrollArea>
		<div class="flex items-center space-x-2 rtl:space-x-reverse">
			<span class="text-sm font-semibold text-gray-900 dark:text-white">{username}</span>
			<span class="text-sm font-normal text-gray-500 dark:text-gray-400"
				>{formatHumanReadableWithContext(created_at)}</span
			>
		</div>
		<p class="h-fit py-2.5 text-sm font-normal text-gray-900 dark:text-white">
			{#if deleted_by_user_id}
				<span class="italic">This message was deleted</span>
			{:else}
				{content}
			{/if}
		</p>
	</ScrollArea>
</div>
