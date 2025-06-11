<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/jsrepo/ui/button';
	import { Type } from 'lucide-svelte';
	import Fonts from './Fonts.svelte';
	import type { FontSelection } from '$lib/types';

	let { font = $bindable<FontSelection | null>(null), onSelect } = $props();

	let isOpen = $state(false);

	const closeDialog = () => {
		onSelect();
		isOpen = false;
	};
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class="mt-3 flex w-1/2 justify-center sm:w-[450px]">
		<Button
			class="flex h-10 w-full items-center bg-lime-600 ring-glow hover:bg-lime-500 dark:bg-lime-900 dark:text-white dark:hover:bg-lime-800"
		>
			<Type class="mr-1" />
			Font
		</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Fonts</Dialog.Title>
			<Dialog.Description>
				<Fonts bind:selectedFont={font} onSelect={closeDialog} />
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
