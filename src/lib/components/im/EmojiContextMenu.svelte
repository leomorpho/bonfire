<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import EmojiContextMenuEntry from './EmojiContextMenuEntry.svelte';

	let { children, toggleEmoji, reactions, currUserId } = $props();

	let isOpen = $state(false);

	const removeEmoji = async () => {
		toggleEmoji();
		isOpen = false;
	};
</script>

{#snippet emojiDef(emoji: string)}
	<span class="ml-2 text-2xl">
		{emoji}
	</span>
{/snippet}

<Popover.Root bind:open={isOpen}>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>
	<Popover.Content class="w-fit rounded-xl bg-slate-300 p-1 text-sm dark:bg-slate-900">
		{#each reactions as reaction}
			<EmojiContextMenuEntry
				{currUserId}
				{toggleEmoji}
				reactionUserId={reaction.user_id}
				reactionEmoji={reaction.emoji}
			/>
		{/each}
	</Popover.Content>
</Popover.Root>
