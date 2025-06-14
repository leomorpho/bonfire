<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import type { ProposedBringList } from '$lib/proposed-bring-lists';
	import { BringListCountTypes } from '$lib/enums';
	import { Check, X, Users, Hash } from 'lucide-svelte';

	let { 
		isOpen = false,
		proposedList,
		numAttendeesGoing = 5,
		onConfirm,
		onCancel
	} = $props<{
		isOpen: boolean;
		proposedList: ProposedBringList | null;
		numAttendeesGoing: number;
		onConfirm: () => void;
		onCancel: () => void;
	}>();

	// Calculate actual quantities based on attendee count
	const calculateQuantity = (item: any, attendeeCount: number) => {
		if (item.unit === BringListCountTypes.PER_PERSON) {
			return Math.max(1, Math.ceil(item.quantity_needed * attendeeCount));
		}
		return item.quantity_needed;
	};

	const getUnitDisplay = (unit: BringListCountTypes) => {
		return unit === BringListCountTypes.PER_PERSON ? 'per person' : 'total';
	};
</script>

{#if proposedList}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Content class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<span class="text-2xl">{proposedList.emoji}</span>
					Add "{proposedList.name}" Items
				</Dialog.Title>
				<Dialog.Description>
					Preview of items that will be added to your bring list. Quantities are calculated based on 
					<Badge variant="secondary" class="mx-1">
						<Users class="w-3 h-3 mr-1" />
						{numAttendeesGoing} attendees going
					</Badge>
				</Dialog.Description>
			</Dialog.Header>

			<Separator />

			<!-- Items Preview -->
			<div class="flex-1 overflow-y-auto py-4">
				<div class="space-y-3">
					{#each proposedList.items as item, index}
						{@const calculatedQuantity = calculateQuantity(item, numAttendeesGoing)}
						<div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-medium text-gray-900 dark:text-gray-100">
										{item.name}
									</h4>
									{#if item.unit === BringListCountTypes.PER_PERSON}
										<Badge variant="outline" class="text-xs">
											<Users class="w-3 h-3 mr-1" />
											Per Person
										</Badge>
									{:else}
										<Badge variant="outline" class="text-xs">
											<Hash class="w-3 h-3 mr-1" />
											Total
										</Badge>
									{/if}
								</div>
								{#if item.details}
									<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
										{item.details}
									</p>
								{/if}
							</div>
							<div class="text-right">
								<div class="font-semibold text-lg text-blue-600 dark:text-blue-400">
									{calculatedQuantity}
								</div>
								<div class="text-xs text-gray-500">
									{item.quantity_needed} {getUnitDisplay(item.unit)}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<Separator />

			<!-- Footer -->
			<div class="flex flex-col sm:flex-row gap-3 pt-4">
				<div class="flex-1">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						<strong>{proposedList.items.length} items</strong> will be added to your bring list. 
						You can edit quantities and details after adding them.
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={onCancel}>
						<X class="w-4 h-4 mr-2" />
						Cancel
					</Button>
					<Button onclick={onConfirm}>
						<Check class="w-4 h-4 mr-2" />
						Add All Items
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}