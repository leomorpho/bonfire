<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Check, HeartHandshake, Pencil, Trash } from 'lucide-svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '../ui/button';

	let {
		photoURL,
		name,
		description,
		websiteURL,
		effectiveStartDate,
		effectivEndDate,
		selected = false,
		toggleFavouriteNonProfit = null,
		updateNonProfit = null,
		deleteNonProfit = null,
		showChangeSelectedNonProfitBtn = false,
		cls = null,
		selectable = false
	} = $props();

	let isDeleteAlertDialogOpen = $state(false);

	const deleteItem = async () => {
		await deleteNonProfit();
		isDeleteAlertDialogOpen = false;
	};
</script>

<Card.Root
	class={`non-profit-card ${cls} ${selectable ? 'cursor-pointer' : ''} relative m-3 max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-slate-100 shadow-sm transition-all duration-200 hover:shadow-lg dark:border-gray-700 dark:bg-slate-800 
	${selected ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' : ''}`}
	onclick={toggleFavouriteNonProfit ? toggleFavouriteNonProfit : null}
>
	<!-- Green Checkmark for Selected -->
	{#if selected}
		<div
			class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow-md"
		>
			<Check size={16} />
		</div>
	{/if}

	<Card.Header>
		{#if photoURL}
			<img src={photoURL} alt={name} class="mb-2 h-32 w-full object-cover" />
		{/if}
		<Card.Title>{name}</Card.Title>
		<Card.Description class="text-sm text-gray-600 dark:text-gray-300">
			{description}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<a href={websiteURL} target="_blank" class="text-blue-600 hover:underline"> Visit Website </a>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
			Effective:
			{effectiveStartDate ? new Date(effectiveStartDate).toISOString().split('T')[0] : 'Unknown'}
			-
			{effectivEndDate ? new Date(effectivEndDate).toISOString().split('T')[0] : 'Ongoing'}
		</p>
	</Card.Content>
	{#if updateNonProfit && deleteNonProfit}
		<Card.Footer class="flex w-full justify-center">
			<!-- Edit Button -->
			<Button variant="outline" class="mx-1" onclick={updateNonProfit}>
				<Pencil class="mr-1" /> Edit
			</Button>

			<!-- Delete Button -->
			<AlertDialog.Root bind:open={isDeleteAlertDialogOpen}>
				<AlertDialog.Trigger>
					<Button variant="destructive" class="mx-1">
						<Trash class="mr-1" /> Delete
					</Button>
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. The non-profit will be permanently deleted.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action onclick={deleteItem}>Delete</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</Card.Footer>
	{:else if showChangeSelectedNonProfitBtn}
		<Card.Footer class="flex w-full justify-center">
			<a href="/profile/non-profits">
				<Button class="mx-1" onclick={updateNonProfit}>
					<HeartHandshake class="mr-1" /> Change the cause you support
				</Button></a
			>
		</Card.Footer>
	{/if}
</Card.Root>

<style>
	/* Selected non-profit style */
	.selected {
		border-color: #3b82f6; /* Tailwind blue-500 */
		background-color: rgba(59, 130, 246, 0.1);
	}
</style>
