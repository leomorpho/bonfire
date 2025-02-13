<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Terminal from 'lucide-svelte/icons/terminal';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { ChevronDown, Flag, Smile, Trash2 } from 'lucide-svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Button from '../ui/button/button.svelte';
	import { formatHumanReadableWithContext } from '$lib/utils';
	import EmojiPicker from '../EmojiPicker.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CustomAlertDialog from '../CustomAlertDialog.svelte';

	let { children, message, isOwnMessage } = $props();

	let contextMenuRef: HTMLElement | null = $state(null);
	let pressTimer: NodeJS.Timeout | null = $state(null);
	let isHolding = $state(false);
	let showAlert = $state(false);
	let showSmiley = $state(false);
	let showSmileyPicker = $state(false);

	const isMobile = () => {
		return typeof window !== 'undefined' && 'ontouchstart' in window;
	};

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
			}, 500); // Long press time
		}
	};

	const handlePointerUp = () => {
		if (pressTimer) clearTimeout(pressTimer);
	};

	onMount(() => {
		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('pointerup', handlePointerUp);
		document.addEventListener('contextmenu', openMenu);
	});

	onDestroy(() => {
		document.removeEventListener('pointerdown', handlePointerDown);
		document.removeEventListener('pointerup', handlePointerUp);
		document.removeEventListener('contextmenu', openMenu);
	});

	// Handle emoji selection
	const addEmoji = (detail: any) => {
		// detail.unicode;
		// TODO
	};

	const onReport = async (messageId: string) => {
		// TODO
	};

	const onDelete = async (messageId: string) => {};
</script>

<div
	bind:this={contextMenuRef}
	class="relative"
	role="button"
	tabindex="0"
	onmouseenter={() => (showSmiley = true)}
	onmouseleave={() => (showSmiley = false)}
	onclick={() => {
		showSmileyPicker = true;
	}}
	onkeydown={(event) => {
		if (event.key === 'Enter' || event.key === ' ') showSmileyPicker = true;
	}}
>
	{@render children()}

	{#if showSmiley || showSmileyPicker}
		<Popover.Root>
			<Popover.Trigger
				class="{showSmileyPicker
					? 'opacity-100'
					: 'opacity-50'} absolute -bottom-4 left-1/2 -translate-x-1/2 transform rounded-full bg-slate-500 p-2 shadow-lg hover:opacity-100 focus:outline-none focus-visible:ring-0"
			>
				<div>
					<Smile class="h-5 w-5 cursor-pointer text-white" />
				</div>
			</Popover.Trigger>
			<Popover.Content class="w-fit">
				<EmojiPicker handleEmojiSelect={addEmoji} />
			</Popover.Content>
		</Popover.Root>
	{/if}

	{#if !isMobile()}
		<button
			class={`absolute top-1 ${isOwnMessage ? 'right-2' : 'left-2'} rounded bg-slate-400 px-1 py-0 text-black opacity-30 focus:outline-none focus-visible:ring-0 dark:bg-slate-600 dark:text-white`}
			onclick={openNonMobileMenu}
		>
			<ChevronDown class="!h-3 !w-3" />
		</button>
	{/if}
</div>

{#snippet messageComponent()}
	<div
		class="leading-1.5 flex max-h-[100px] w-full max-w-[320px]
			flex-col overflow-hidden rounded-s-xl rounded-se-xl bg-blue-100 p-4 dark:bg-blue-600"
	>
		<div class="flex items-center space-x-2 rtl:space-x-reverse">
			<span class="text-sm font-semibold text-gray-900 dark:text-white"
				>{message.user?.username}</span
			>
			<span class="text-sm font-normal text-gray-500 dark:text-gray-400"
				>{formatHumanReadableWithContext(message.created_at)}</span
			>
		</div>
		<p class="py-2.5 text-sm font-normal text-gray-900 dark:text-white">
			{message.content}
		</p>
	</div>
{/snippet}

<AlertDialog.Root bind:open={showAlert}>
	<AlertDialog.Content
		class="w-3/4 rounded-3xl animate-in fade-in zoom-in"
		interactOutsideBehavior="close"
	>
		<div class="flex w-full justify-center">
			{@render messageComponent()}
		</div>
		<div class="block w-full sm:hidden">
			<div class="flex w-full justify-center"><EmojiPicker handleEmojiSelect={''} /></div>
		</div>

		{#if isOwnMessage}
			<CustomAlertDialog
				continueCallback={() => onDelete(message.id)}
				dialogDescription={"This message will be reported to this bonfire's admins. This cannot be undone."}
				cls={'w-full'}
			>
				<Button
					class="flex w-full justify-between bg-slate-200 text-red-500 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
					>Delete <Trash2 /></Button
				>
			</CustomAlertDialog>
		{:else}
			<CustomAlertDialog
				continueCallback={() => onReport(message.id)}
				dialogDescription={"This message will be reported to this bonfire's admins. This cannot be undone."}
				cls={'w-full'}
			>
				<Button
					class="flex w-full justify-between bg-slate-200 text-black hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
					>Report <Flag /></Button
				>
			</CustomAlertDialog>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
