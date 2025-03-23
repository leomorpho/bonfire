<script lang="ts">
	import { UserRoundPlus } from 'lucide-svelte';
	import Button from '../ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import PlusOneSelect from './PlusOneSelect.svelte';
	import LoadingSpinner from '../LoadingSpinner.svelte';

	let {
		numGuests = $bindable<number>(),
		maxNumGuestsAllowedPerAttendee = 0,
		updateCallback
	} = $props();

	let isPlusOneSelectDialogOpen = $state(false);
	let isSaving = $state(false);

	const openDialog = () => {
		isPlusOneSelectDialogOpen = true;
	};

	const save = async (e: Event) => {
		await updateCallback(e);
		isPlusOneSelectDialogOpen = false;
	};
</script>

<Button id="num-guest-you-are-bringing" class="flex items-center" onclick={openDialog}>
	<UserRoundPlus class="mr-" />
	{#if numGuests}
		{numGuests}
	{:else}
		Guests
	{/if}
</Button>

<Dialog.Root bind:open={isPlusOneSelectDialogOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header class="flex w-full flex-col justify-center">
			<Dialog.Title>Are you bringing any guests?</Dialog.Title>
			<Dialog.Description>Let us know if you are, don't count yourself.</Dialog.Description>
		</Dialog.Header>

		<PlusOneSelect bind:numGuests maxGuests={maxNumGuestsAllowedPerAttendee} />
		<Button
			class="relative w-full"
			onclick={(e) => {
				save(e);
			}}
		>
			{#if isSaving}
				<div class="absolute left-1 flex items-center">
					<LoadingSpinner cls={'!h-4 !w-4'} />
				</div>
			{/if}
			Let's go!
		</Button>
	</Dialog.Content>
</Dialog.Root>
