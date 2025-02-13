<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import Terminal from 'lucide-svelte/icons/terminal';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { ChevronDown } from 'lucide-svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	const dispatch = createEventDispatcher();

	let { children, messageId, isOwnMessage } = $props();

	let contextMenuRef: HTMLElement | null = $state(null);
	let pressTimer: NodeJS.Timeout | null = $state(null);
	let isHolding = $state(false);
	let showAlert = $state(false);

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
</script>

<div bind:this={contextMenuRef} class="relative">
	{@render children()}

	{#if !isMobile()}
		<button
			class={`absolute top-1 ${isOwnMessage ? 'right-2' : 'left-2'} rounded bg-slate-600 px-1 py-0 opacity-30`}
			onclick={openNonMobileMenu}
		>
			<ChevronDown class="!h-3 !w-3" />
		</button>
	{/if}
</div>

<AlertDialog.Root bind:open={showAlert}>
	<AlertDialog.Content class="animate-in fade-in zoom-in">
		<AlertDialog.Title>Message Options</AlertDialog.Title>
		<AlertDialog.Description>Choose an action for this message.</AlertDialog.Description>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => (showAlert = false)}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				onclick={() => {
					dispatch('delete', { messageId });
					showAlert = false;
				}}>Delete</AlertDialog.Action
			>
			<AlertDialog.Action
				onclick={() => {
					dispatch('emoji', { messageId });
					showAlert = false;
				}}>Add Emoji</AlertDialog.Action
			>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
