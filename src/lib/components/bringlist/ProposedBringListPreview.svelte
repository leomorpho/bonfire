<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { ProposedBringList } from '$lib/proposed-bring-lists';
	import { BringListCountTypes } from '$lib/enums';
	import { Check, X, Users, Hash, Minus, Plus } from 'lucide-svelte';

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
		onConfirm: (adjustedAttendeeCount: number) => void;
		onCancel: () => void;
	}>();

	// Local attendee count that can be adjusted
	let adjustedAttendeeCount = $state(numAttendeesGoing);

	// Reset the adjusted count when dialog opens or props change
	$effect(() => {
		if (isOpen) {
			adjustedAttendeeCount = numAttendeesGoing;
		}
	});

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

	// Handle attendee count adjustment
	const decrementAttendees = () => {
		if (adjustedAttendeeCount > 1) {
			adjustedAttendeeCount--;
		}
	};

	const incrementAttendees = () => {
		if (adjustedAttendeeCount < 100) {
			adjustedAttendeeCount++;
		}
	};

	const handleConfirm = () => {
		onConfirm(adjustedAttendeeCount);
	};
</script>

{#if proposedList}
	<Dialog.Root bind:open={isOpen}>
		<Dialog.Content class="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
			<Dialog.Header>
				<Dialog.Title class="flex items-center gap-2">
					<span class="text-2xl">{proposedList.emoji}</span>
					Add "{proposedList.name}" Items
				</Dialog.Title>
				<Dialog.Description>
					Preview of items that will be added to your bring list. You can adjust the expected
					attendee count to get accurate quantities.
				</Dialog.Description>
			</Dialog.Header>

			<!-- Attendee Count Adjustment -->
			<div class="rounded-lg bg-blue-50 py-4 dark:bg-blue-950/30">
				<div class="flex items-center justify-between px-4">
					<div class="flex-1">
						<Label class="text-sm font-medium">Expected Attendees</Label>
						<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
							Adjust this number to get accurate quantity estimates
						</p>
					</div>
					<div class="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onclick={decrementAttendees}
							disabled={adjustedAttendeeCount <= 1}
							class="h-8 w-8 p-0"
						>
							<Minus class="h-4 w-4" />
						</Button>
						<div
							class="flex min-w-[120px] items-center justify-center gap-2 rounded-md border bg-white px-3 py-1 dark:bg-gray-800"
						>
							<Users class="h-4 w-4 text-blue-500" />
							<span class="font-semibold">{adjustedAttendeeCount}</span>
							<span class="text-sm text-gray-500">going</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={incrementAttendees}
							disabled={adjustedAttendeeCount >= 100}
							class="h-8 w-8 p-0"
						>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>

			<Separator />

			<!-- Items Preview -->
			<div class="flex-1 overflow-y-auto py-4">
				<div class="space-y-3">
					{#each proposedList.items as item, index}
						{@const calculatedQuantity = calculateQuantity(item, adjustedAttendeeCount)}
						<div
							class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
						>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h4 class="font-medium text-gray-900 dark:text-gray-100">
										{item.name}
									</h4>
									{#if item.unit === BringListCountTypes.PER_PERSON}
										<Badge variant="outline" class="text-xs">
											<Users class="mr-1 h-3 w-3" />
											Per Person
										</Badge>
									{:else}
										<Badge variant="outline" class="text-xs">
											<Hash class="mr-1 h-3 w-3" />
											Total
										</Badge>
									{/if}
								</div>
								{#if item.details}
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										{item.details}
									</p>
								{/if}
							</div>
							<div class="text-right">
								<div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
									{calculatedQuantity}
								</div>
								<div class="text-xs text-gray-500">
									{item.quantity_needed}
									{getUnitDisplay(item.unit)}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<Separator />

			<!-- Footer -->
			<div class="flex flex-col gap-3 pt-4 sm:flex-row">
				<div class="flex-1">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						<strong>{proposedList.items.length} items</strong> will be added to your bring list. You
						can edit quantities and details after adding them.
					</p>
				</div>
				<div class="flex gap-2">
					<Button variant="outline" onclick={onCancel}>
						<X class="mr-2 h-4 w-4" />
						Cancel
					</Button>
					<Button onclick={handleConfirm}>
						<Check class="mr-2 h-4 w-4" />
						Add All Items
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
