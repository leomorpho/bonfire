<script lang="ts">
	import { ChevronDown, Copy, Smile, Trash2 } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { isMobile } from '$lib/utils';
	import EmojiPicker from '../EmojiPicker.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CustomAlertDialog from '../CustomAlertDialog.svelte';
	import { getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { toggleEmojiReaction } from '$lib/emoji';
	import { EMOJI_REACTION_TYPE } from '$lib/enums';
	import MessageContent from './MessageContent.svelte';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { TriplitClient } from '@triplit/client';

	let {
		children,
		message,
		showContextMenu,
		isOwnMessage,
		isCurrenUserEventAdmin,
		eventId,
		canInteract = true
	} = $props();

	let showAlert = $state(false);
	let showSmiley = $state(false);
	let showSmileyPicker = $state(false);
	let isMobileTouch = $state(isMobile());

	const openMenu = (event?: PointerEvent) => {
		showAlert = true;
	};

	const openNonMobileMenu = () => {
		showAlert = true;
	};

	$effect(() => {
		if (showContextMenu) {
			openMenu();
		}
	});

	// Handle emoji selection
	const toggleEmoji = async (detail: any) => {
		console.log('Selected emoji', detail.unicode);
		if (!canInteract) {
			showSmileyPicker = false;
			toast.warning(
				"Temporary users can't interact in the discussions. Please log in or sign up to participate."
			);
			return;
		}
		const client = await getFeWorkerTriplitClient($page.data.jwt);
		await toggleEmojiReaction(
			client,
			$page.data.user.id,
			eventId,
			message.id,
			EMOJI_REACTION_TYPE.MESSAGE,
			detail.unicode
		);

		showSmileyPicker = false;
		showAlert = false;
	};

	const onReport = async (messageId: string) => {
		// TODO
		showAlert = false;
	};

	const onDelete = async (messageId: string) => {
		const client = (await getFeWorkerTriplitClient($page.data.jwt)) as TriplitClient;
		await client.http.update('event_messages', messageId, async (entity: any) => {
			entity.content = '';
			entity.deleted_by_user_id = $page.data.user.id;
		});
		showAlert = false;
	};

	const onCopy = async () => {
		try {
			await navigator.clipboard.writeText(message.content);
			showAlert = false;
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	const onMouseEnterShowSmiley = () => {
		if (isMobileTouch) {
			return;
		}
		showSmiley = true;
	};

	const onMouseExitHideSmiley = () => {
		showSmiley = false;
	};
</script>

{#snippet emojiPicker()}
	{#if !isMobileTouch}
		<Popover.Root>
			<Popover.Trigger
				onclick={() => {
					showSmileyPicker = !showSmileyPicker;
				}}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') showSmileyPicker = !showSmileyPicker;
				}}
				class="emoji-picker {showSmileyPicker
					? 'opacity-100'
					: 'opacity-70'} transform rounded-full bg-slate-500 p-2 shadow-lg hover:opacity-100 focus:outline-none focus-visible:ring-0"
			>
				<div>
					<Smile class="h-5 w-5 cursor-pointer text-white" />
				</div>
			</Popover.Trigger>
			<Popover.Content class="w-fit rounded-2xl bg-slate-900">
				<EmojiPicker handleEmojiSelect={toggleEmoji} />
			</Popover.Content>
		</Popover.Root>
	{/if}
{/snippet}

<div
	class="relative"
	role="button"
	tabindex="0"
	onmouseenter={onMouseEnterShowSmiley}
	onmouseleave={onMouseExitHideSmiley}
>
	{@render children()}

	{#if !isMobileTouch}
		<div class="absolute -bottom-2 left-1/2 z-50 -translate-x-1/2">
			<div class="flex flex-wrap items-center gap-1">
				{#if showSmiley || showSmileyPicker}
					{@render emojiPicker()}
				{/if}
			</div>
		</div>
		<button
			class={`absolute top-1 ${isOwnMessage ? 'right-2' : 'left-2'} rounded bg-slate-400 px-1 py-0 text-black opacity-30 focus:outline-none focus-visible:ring-0 dark:bg-slate-600 dark:text-white`}
			onclick={openNonMobileMenu}
		>
			<ChevronDown class="!h-3 !w-3" />
		</button>
	{/if}
</div>

<Dialog.Root bind:open={showAlert}>
	<Dialog.Content
		class="w-full rounded-3xl border-0 animate-in fade-in zoom-in sm:max-w-[400px]  {showContextMenu
			? 'pointer-events-none'
			: 'pointer-events-auto'}"
		interactOutsideBehavior="close"
	>
		<div class="flex h-fit w-full justify-center">
			<MessageContent
				username={message.user?.username}
				content={message.content}
				created_at={message.created_at}
				deleted_by_user_id={message.deleted_by_user_id}
			/>
		</div>
		<div class="flex w-full items-center justify-center">
			<EmojiPicker handleEmojiSelect={toggleEmoji} />
		</div>

		<Button onclick={onCopy} class="flex w-full justify-between ">Copy <Copy /></Button>
		{#if isOwnMessage || isCurrenUserEventAdmin}
			{#if !message.deleted_by_user_id}
				<CustomAlertDialog
					continueCallback={() => onDelete(message.id)}
					dialogDescription={'This message will be deleted. This cannot be undone.'}
					cls={'w-full z-[60]'}
				>
					<Button
						class="flex w-full justify-between bg-slate-200 text-red-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
						>Delete <Trash2 /></Button
					>
				</CustomAlertDialog>
			{/if}
		{:else}
			<!-- <CustomAlertDialog
				continueCallback={() => onReport(message.id)}
				dialogDescription={"This message will be reported to this bonfire's admins. This cannot be undone."}
				cls={'w-full'}
			>
				<Button
					class="flex w-full justify-between bg-slate-200 text-black hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
					>Report <Flag /></Button
				>
			</CustomAlertDialog> -->
		{/if}
	</Dialog.Content>
</Dialog.Root>
