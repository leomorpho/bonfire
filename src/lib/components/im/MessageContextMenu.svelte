<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { ChevronDown, Smile, Trash2 } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import { isMobile } from '$lib/utils';
	import EmojiPicker from '../EmojiPicker.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CustomAlertDialog from '../CustomAlertDialog.svelte';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { toggleEmojiReaction } from '$lib/emoji';
	import { EMOJI_REACTION_TYPE } from '$lib/enums';
	import MessageContent from './MessageContent.svelte';
	import { toast } from 'svelte-sonner';

	let {
		children,
		message,
		isOwnMessage,
		isCurrenUserEventAdmin,
		eventId,
		canInteract = true
	} = $props();

	let contextMenuRef: HTMLElement | null = $state(null);
	let pressTimer: NodeJS.Timeout | null = $state(null);
	let isHolding = $state(false);
	let showAlert = $state(false);
	let showSmiley = $state(false);
	let showSmileyPicker = $state(false);

	const openMenu = (event?: PointerEvent) => {
		if (event) event.preventDefault();
		showAlert = true;
	};

	const openNonMobileMenu = () => {
		showAlert = true;
	};

	const handlePointerDown = (event: PointerEvent) => {
		if (isMobile()) {
			pressTimer = setTimeout(() => {
				isHolding = true;
				openMenu(event);
			}, 100); // Long press time
		}
	};

	onMount(() => {
		if (contextMenuRef) {
			contextMenuRef.addEventListener('pointerdown', handlePointerDown);
		}
	});

	onDestroy(() => {
		if (contextMenuRef) {
			contextMenuRef.removeEventListener('pointerdown', handlePointerDown);
		}
	});

	// Handle emoji selection
	const toggleEmoji = async (detail: any) => {
		if (!canInteract) {
			showSmileyPicker = false;
			toast.warning("Temporary users can't interact. Please log in or sign up to participate.");
			return;
		}
		const client = await getFeTriplitClient($page.data.jwt);
		await toggleEmojiReaction(
			client,
			$page.data.user.id,
			eventId,
			message.id,
			EMOJI_REACTION_TYPE.MESSAGE,
			detail.unicode
		);

		showSmileyPicker = false;
	};

	const onReport = async (messageId: string) => {
		// TODO
		showAlert = false;
	};

	const onDelete = async (messageId: string) => {
		const client = await getFeTriplitClient($page.data.jwt);
		await client.update('event_messages', messageId, async (entity: any) => {
			entity.content = '';
			entity.deleted_by_user_id = $page.data.user.id;
		});
		showAlert = false;
	};
</script>

{#snippet emojiPicker()}
	<Popover.Root>
		<Popover.Trigger
			onclick={() => {
				showSmileyPicker = !showSmileyPicker;
			}}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') showSmileyPicker = !showSmileyPicker;
			}}
			class="{showSmileyPicker
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
{/snippet}

<div
	bind:this={contextMenuRef}
	class="relative"
	role="button"
	tabindex="0"
	onmouseenter={() => (showSmiley = true)}
	onmouseleave={() => (showSmiley = false)}
>
	{@render children()}

	<div class="absolute -bottom-2 left-1/2 z-50 -translate-x-1/2">
		<div class="flex flex-wrap items-center gap-1">
			{#if showSmiley || showSmileyPicker}
				{@render emojiPicker()}
			{/if}
		</div>
	</div>

	{#if !isMobile()}
		<button
			class={`absolute top-1 ${isOwnMessage ? 'right-2' : 'left-2'} rounded bg-slate-400 px-1 py-0 text-black opacity-30 focus:outline-none focus-visible:ring-0 dark:bg-slate-600 dark:text-white`}
			onclick={openNonMobileMenu}
		>
			<ChevronDown class="!h-3 !w-3" />
		</button>
	{/if}
</div>

<AlertDialog.Root bind:open={showAlert}>
	<AlertDialog.Content
		class="w-full max-w-[400px] rounded-3xl border-0 bg-transparent animate-in fade-in zoom-in sm:max-w-[400px]"
		interactOutsideBehavior="close"
	>
		<div class="flex w-full justify-center">
			<MessageContent
				username={message.user?.username}
				content={message.content}
				created_at={message.created_at}
				deleted_by_user_id={message.deleted_by_user_id}
			/>
		</div>
		<div class="block w-full sm:hidden">
			<div class="flex w-full justify-center"><EmojiPicker handleEmojiSelect={''} /></div>
		</div>

		{#if isOwnMessage || isCurrenUserEventAdmin}
			{#if !message.deleted_by_user_id}
				<CustomAlertDialog
					continueCallback={() => onDelete(message.id)}
					dialogDescription={'This message will be deleted. This cannot be undone.'}
					cls={'w-full'}
				>
					<Button
						class="flex w-full justify-between bg-slate-200 text-red-500 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
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
					class="flex w-full justify-between bg-slate-200 text-black hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
					>Report <Flag /></Button
				>
			</CustomAlertDialog> -->
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
