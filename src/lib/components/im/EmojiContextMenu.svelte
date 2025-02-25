<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import ProfileAvatar from '../ProfileAvatar.svelte';

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
			<div
				class="{reaction.user_id == currUserId
					? 'hover:rounded-lg hover:bg-slate-400 dark:hover:bg-slate-800'
					: ''} flex items-center justify-between p-2"
			>
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
