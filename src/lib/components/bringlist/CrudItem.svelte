<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '../ui/button';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ItemCategory from './items/ItemCategory.svelte';
	import { BringListCountTypes } from '$lib/enums';
	import TextAreaAutoGrow from '../input/TextAreaAutoGrow.svelte';
	import {
		assignBringItem,
		createBringItem,
		deleteBringItemAndAssignments,
		updateBringItem
	} from '$lib/bringlist';
	import { getFeHttpTriplitClient, getFeWorkerTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import CustomAlertDialog from '../CustomAlertDialog.svelte';
	import { Trash2 } from 'lucide-svelte';
	import type { TriplitClient } from '@triplit/client';

	let {
		children,
		eventId,
		numAttendeesGoing,
		isOpen = false,
		item = null,
		class: cls = null,
		isAdmin = false
	} = $props();

	let itemName = $state(item ? item.name : '');
	let unitType = $state(item ? item.unit : BringListCountTypes.COUNT);
	let count = $state(item ? item.quantity_needed : numAttendeesGoing);
	let details = $state('');

	let submitEnabled = $derived(itemName && count != 0);

	const deleteItem = async () => {
		const client: TriplitClient = (await getFeWorkerTriplitClient($page.data.jwt)) as TriplitClient;
		if (!item) {
			return;
		}
		if (!client) {
			throw new Error('client not available');
		}

		try {
			console.log('about to delete item.id', item.id);
			// Fetch all related bring_assignments
			const assignments = await client.fetch(
				client.http.query('bring_assignments').Where([['bring_item_id', '=', item.id]])
			);
			console.log('Fetched assignments:', assignments);

			// Delete each assignment
			for (const assignment of assignments) {
				await client.http.delete('bring_assignments', assignment.id);
			}
			console.log('about to delete bring item with id', item.id);
			// Delete the bring_item
			await client.http.delete('bring_items', item.id);

			console.log('Bring item and related assignments deleted successfully.');

			toast.success(`Successfully deleted bring item "${itemName}"`);
			isOpen = false;
		} catch (e) {
			console.error(`failed to delete bring item with id ${item.id}`, e);
		}
	};

	const upsertItem = async () => {
		const client = await getFeHttpTriplitClient($page.data.jwt);
		if (!itemName || count == 0) {
			return;
		}
		if (!item) {
			try {
				const item = await createBringItem(
					client,
					eventId,
					$page.data.user.id,
					itemName,
					unitType,
					count,
					details
				);
				if (!isAdmin) {
					console.log('ASSIGNING TO CURRENT USER');
					// Default to the user bringing all of this type
					await assignBringItem(
						client,
						item.id,
						$page.data.user.id,
						null,
						$page.data.user.id,
						count
					);
					switch (unitType) {
						case BringListCountTypes.PER_PERSON:
							toast.success(
								`You're now bringing "${itemName}" for ${count} ${count == 1 ? 'person' : 'people'}`
							);
							break;
						case BringListCountTypes.PER_PERSON:
							toast.success(`You're now bringing ${count} "${itemName}"`);
					}
				} else {
					toast.success(`Successfully added ${itemName} to the bring list`);
				}
			} catch (e) {
				console.log('failed to create bring item', e);
				toast.error('Sorry, we failed to create this bring item, please try again later');
			}
		} else {
			try {
				await updateBringItem(client, item.id, {
					name: itemName,
					unit: unitType,
					quantity_needed: count,
					details: details
				});
			} catch (e) {
				console.log('failed to update bring item', e);
				toast.error('Sorry, we failed to update this bring item, please try again later');
			} finally {
				toast.success(`Successfully updated ${itemName} for the bring list`);
			}
		}
		isOpen = false;
	};
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger class={`${cls} flex w-full justify-center`}>
		{@render children()}
	</Dialog.Trigger>
	<Dialog.Content class="rounded-xl">
		<Dialog.Header>
			<Dialog.Title class="flex w-full justify-center">
				{item ? 'Edit' : 'Add'}
			</Dialog.Title>
			<!-- <Dialog.Description>
				This action cannot be undone. This will permanently delete your account and remove your data
				from our servers.
			</Dialog.Description> -->
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name" class="text-right">Item name</Label>
				<Input id="name" placeholder="Chicken thighs" class="col-span-3" bind:value={itemName} />
			</div>

			<div class="flex w-full items-center justify-center space-y-4">
				<div class="flex space-x-2">
					<ItemCategory bind:currentlySelectedType={unitType} />
					<Input
						id="bring-list-item-count"
						type="number"
						min="1"
						pattern="[0-9]*"
						inputmode="numeric"
						class="w-16"
						placeholder="5"
						{oninput}
						bind:value={count}
					/>
				</div>
			</div>
			<TextAreaAutoGrow
				class={''}
				placeholder={`Any details you'd like to add about that item you're bringing?`}
				bind:value={details}
				oninput={() => {}}
			/>
		</div>
		<Dialog.Footer>
			{#if item}
				<CustomAlertDialog
					continueCallback={() => deleteItem()}
					dialogDescription={'This bring item will be deleted. This cannot be undone.'}
					cls={'w-full'}
				>
					<Button
						id="delete-bring-item"
						class="m-1 flex w-full justify-center bg-slate-200 text-red-500 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
						><Trash2 class="mr-1" /> Delete
					</Button>
				</CustomAlertDialog>
			{/if}
			<Button
				id="upsert-bring-list-item"
				disabled={!submitEnabled}
				onclick={upsertItem}
				type="submit"
				class="m-1 w-full">{item ? 'Save Changes' : 'Add'}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
