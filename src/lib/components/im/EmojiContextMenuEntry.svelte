<script lang="ts">
	import { onMount } from 'svelte';
	import ProfileAvatar from '../profile/profile-avatar/ProfileAvatar.svelte';
	import { addUserRequest, usersLiveDataStore } from '$lib/profilestore';

	let { currUserId, toggleEmoji, reactionUserId, reactionEmoji } = $props();

	let isOpen = $state(false);

	const removeEmoji = async () => {
		toggleEmoji();
		isOpen = false;
	};

	let unsubscribe: any; // Store unsubscribe function
	let username: string | null | undefined = $state('');

	onMount(() => {
		addUserRequest(reactionUserId);

		unsubscribe = usersLiveDataStore.subscribe((users) => {
			const user = users[reactionUserId];
			if (!user) return;

			username = user?.username;
		});
	});
</script>

{#snippet emojiDef(emoji: string)}
	<span class="ml-2 text-2xl">
		{emoji}
	</span>
{/snippet}

<div
	class="{reactionUserId == currUserId
		? 'hover:rounded-lg hover:bg-slate-400 dark:hover:bg-slate-800'
		: ''} flex items-center justify-between p-2"
>
	<span class="mr-2"><ProfileAvatar userId={reactionUserId} baseHeightPx={25} /></span>
	{#if reactionUserId == currUserId}
		<button onclick={removeEmoji}>
			<div>{username}</div>
			<div class="text-xs">Click to remove</div>
		</button>
		{@render emojiDef(reactionEmoji)}
	{:else}
		{username}
		{@render emojiDef(reactionEmoji)}
	{/if}
</div>
