<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '../ui/button';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import ItemCategory from './ItemCategory.svelte';
	import { BringListCountTypes } from '$lib/enums';
	import TextAreaAutoGrow from '../TextAreaAutoGrow.svelte';
	import { createBringItem, updateBringItem } from '$lib/bringlist';
	import { getFeTriplitClient } from '$lib/triplit';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let { eventId, isOpen = false, item = null, numAttendeesGoing = 5 } = $props();

	let itemName = $state('');
	let unitType = $state(BringListCountTypes.PER_PERSON);
	let count = $state(numAttendeesGoing);
	let details = $state('');

	let submitEnabled = $derived(itemName && count != 0);

	const upsertItem = async () => {
		const client = await getFeTriplitClient($page.data.jwt);
		if (!itemName || count == 0) {
			return;
		}

		if (!item) {
			try {
				await createBringItem(
					client,
					eventId,
					$page.data.user.id,
					itemName,
					unitType,
					count,
					details
				);
			} catch (e) {
				console.log('failed to create bring item', e);
				toast.error('Sorry, we failed to create this bring item, please try again later');
			} finally {
				toast.success(`Successfully added ${itemName} to the bring list`);
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
	<Dialog.Trigger class="mt-5 w-full">
		<Button
			class="flex w-full items-center justify-center ring-glow dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
			>Add</Button
		>
	</Dialog.Trigger>
	<Dialog.Content class="rounded-xl">
		<Dialog.Header>
			<Dialog.Title class="flex w-full justify-center">Bring list item</Dialog.Title>
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
						id="count"
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
				cls={''}
				placeholder="We need enough to feed 5 people!"
				bind:value={details}
				oninput={() => {}}
			/>
		</div>
		<Dialog.Footer>
			<Button disabled={!submitEnabled} onclick={upsertItem} type="submit" class="w-full"
				>{item ? 'Save Changes' : 'Add'}</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
