<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import ProfileAvatar from '../ProfileAvatar.svelte';
	import Avatar from '../ui/avatar/avatar.svelte';
	import Button from '../ui/button/button.svelte';

	let { children, toggleEmoji, reactions, currUserId } = $props();

	let isOpen = $state(false);

	const removeEmoji = async () => {
		toggleEmoji();
		isOpen = false;
	};
</script>

{#snippet emojiDef(emoji: string)}
	<span class="text-2xl ml-2">
		{emoji}
	</span>
{/snippet}


<Popover.Root bind:open={isOpen}>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>
	<Popover.Content class="w-fit bg-slate-900 text-sm p-1 rounded-xl">
		{#each reactions as reaction}
			<div class="{reaction.user_id == currUserId?'hover:bg-slate-800 hover:rounded-lg':''} p-2 flex items-center justify-between">
				<span class="mr-2"><ProfileAvatar userId={reaction.user_id} baseHeightPx={25} /></span>
				{#if reaction.user_id == currUserId}
					<button onclick={removeEmoji}>
						<div>{reaction.user_id}</div>
						<div class="text-xs">Click to remove</div>
					</button>
					{@render emojiDef(reaction.emoji)}
				{:else}
					{reaction.user_id}
					{@render emojiDef(reaction.emoji)}
				{/if}
			</div>
		{/each}
	</Popover.Content>
</Popover.Root>
