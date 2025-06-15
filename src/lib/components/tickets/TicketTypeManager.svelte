<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus, Edit, Trash2, Ticket, DollarSign } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { formatPrice, toSmallestUnit, fromSmallestUnit, getCurrency, getMinimumAmountText, meetsMinimumAmount } from '$lib/currencies';

	let { eventId, ticketTypes = $bindable([]), canEdit = false, currency = 'usd' } = $props();

	// Form state
	let dialogOpen = $state(false);
	let editingTicketType = $state(null);
	let isSubmitting = $state(false);

	// Form fields
	let name = $state('');
	let description = $state('');
	let price = $state('');
	let quantityAvailable = $state('');
	let saleStartDate = $state('');
	let saleEndDate = $state('');

	function resetForm() {
		name = '';
		description = '';
		price = '';
		quantityAvailable = '';
		saleStartDate = '';
		saleEndDate = '';
		editingTicketType = null;
	}

	function openCreateDialog() {
		resetForm();
		dialogOpen = true;
	}

	function openEditDialog(ticketType) {
		editingTicketType = ticketType;
		name = ticketType.name;
		description = ticketType.description || '';
		price = fromSmallestUnit(ticketType.price, currency).toString();
		quantityAvailable = ticketType.quantity_available?.toString() || '';
		saleStartDate = ticketType.sale_start_date ? 
			new Date(ticketType.sale_start_date).toISOString().slice(0, 16) : '';
		saleEndDate = ticketType.sale_end_date ? 
			new Date(ticketType.sale_end_date).toISOString().slice(0, 16) : '';
		dialogOpen = true;
	}

	async function submitForm(event) {
		event.preventDefault();
		
		if (!name || !name.trim() || !price || !price.toString().trim()) {
			toast.error('Name and price are required');
			return;
		}

		const priceInSmallestUnit = toSmallestUnit(parseFloat(price), currency);
		if (priceInSmallestUnit < 0) {
			toast.error('Price must be non-negative');
			return;
		}

		if (!meetsMinimumAmount(priceInSmallestUnit, currency)) {
			toast.error(`Price must be at least ${getMinimumAmountText(currency)}`);
			return;
		}

		isSubmitting = true;

		try {
			const data = {
				eventId,
				name: name.trim(),
				description: description.trim() || null,
				price: priceInSmallestUnit,
				currency: currency,
				quantity_available: quantityAvailable ? parseInt(quantityAvailable) : null,
				sale_start_date: saleStartDate || null,
				sale_end_date: saleEndDate || null
			};

			let response;
			if (editingTicketType) {
				// Update existing ticket type
				response = await fetch('/api/tickets/types', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						ticketTypeId: editingTicketType.id,
						...data
					})
				});
			} else {
				// Create new ticket type
				response = await fetch('/api/tickets/types', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});
			}

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to save ticket type');
				return;
			}

			const result = await response.json();
			
			if (editingTicketType) {
				// Update existing ticket type in the list
				const index = ticketTypes.findIndex(tt => tt.id === editingTicketType.id);
				if (index !== -1) {
					ticketTypes[index] = result.ticketType;
				}
				toast.success('Ticket type updated successfully');
			} else {
				// Add new ticket type to the list
				ticketTypes.push(result.ticketType);
				toast.success('Ticket type created successfully');
			}

			dialogOpen = false;
			resetForm();
		} catch (error) {
			console.error('Error saving ticket type:', error);
			toast.error('Failed to save ticket type');
		} finally {
			isSubmitting = false;
		}
	}

	async function deleteTicketType(ticketType) {
		if (!confirm(`Are you sure you want to delete "${ticketType.name}"?`)) {
			return;
		}

		try {
			const response = await fetch('/api/tickets/types', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticketTypeId: ticketType.id })
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to delete ticket type');
				return;
			}

			// Remove from list
			ticketTypes = ticketTypes.filter(tt => tt.id !== ticketType.id);
			toast.success('Ticket type deleted successfully');
		} catch (error) {
			console.error('Error deleting ticket type:', error);
			toast.error('Failed to delete ticket type');
		}
	}

	async function toggleTicketTypeStatus(ticketType) {
		try {
			const response = await fetch('/api/tickets/types', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticketTypeId: ticketType.id,
					is_active: !ticketType.is_active
				})
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to update ticket type');
				return;
			}

			// Update status in list
			const index = ticketTypes.findIndex(tt => tt.id === ticketType.id);
			if (index !== -1) {
				ticketTypes[index].is_active = !ticketTypes[index].is_active;
			}

			toast.success(`Ticket type ${ticketType.is_active ? 'disabled' : 'enabled'}`);
		} catch (error) {
			console.error('Error updating ticket type status:', error);
			toast.error('Failed to update ticket type');
		}
	}

	function formatTicketPrice(priceInSmallestUnit) {
		return formatPrice(priceInSmallestUnit, currency);
	}

	function formatDate(dateString) {
		if (!dateString) return 'No limit';
		return new Date(dateString).toLocaleDateString();
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Ticket class="h-5 w-5" />
			<h3 class="text-lg font-semibold">Ticket Types</h3>
		</div>
		{#if canEdit}
			<Button onclick={openCreateDialog} class="flex items-center gap-2">
				<Plus class="h-4 w-4" />
				Add Ticket Type
			</Button>
		{/if}
	</div>

	{#if ticketTypes.length === 0}
		<div class="text-center py-8 text-muted-foreground">
			{#if canEdit}
				No ticket types created yet. Click "Add Ticket Type" to get started.
			{:else}
				No ticket types available for this event.
			{/if}
		</div>
	{:else}
		<div class="grid gap-4">
			{#each ticketTypes as ticketType (ticketType.id)}
				<Card.Root class={`transition-opacity ${!ticketType.is_active ? 'opacity-60' : ''}`}>
					<Card.Content class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-2">
									<h4 class="font-semibold">{ticketType.name}</h4>
									{#if !ticketType.is_active}
										<span class="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
											Disabled
										</span>
									{/if}
								</div>
								
								{#if ticketType.description}
									<p class="text-sm text-muted-foreground mb-2">{ticketType.description}</p>
								{/if}

								<div class="flex items-center gap-4 text-sm">
									<div class="flex items-center gap-1">
										<DollarSign class="h-4 w-4" />
										<span class="font-medium">{formatTicketPrice(ticketType.price)}</span>
									</div>
									
									<div>
										<span class="text-muted-foreground">Available:</span>
										{ticketType.quantity_available ? 
											`${ticketType.quantity_available - ticketType.quantity_sold}` : 
											'Unlimited'}
									</div>
									
									<div>
										<span class="text-muted-foreground">Sold:</span>
										{ticketType.quantity_sold || 0}
									</div>
								</div>

								{#if ticketType.sale_start_date || ticketType.sale_end_date}
									<div class="flex gap-4 text-xs text-muted-foreground mt-2">
										<div>
											<span>Sale starts:</span> {formatDate(ticketType.sale_start_date)}
										</div>
										<div>
											<span>Sale ends:</span> {formatDate(ticketType.sale_end_date)}
										</div>
									</div>
								{/if}
							</div>

							{#if canEdit}
								<div class="flex items-center gap-2 ml-4">
									<Button 
										variant="outline" 
										size="sm"
										onclick={() => toggleTicketTypeStatus(ticketType)}
									>
										{ticketType.is_active ? 'Disable' : 'Enable'}
									</Button>
									
									<Button 
										variant="outline" 
										size="sm"
										onclick={() => openEditDialog(ticketType)}
									>
										<Edit class="h-4 w-4" />
									</Button>
									
									{#if ticketType.quantity_sold === 0}
										<Button 
											variant="outline" 
											size="sm"
											onclick={() => deleteTicketType(ticketType)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									{/if}
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}

	<!-- Create/Edit Dialog -->
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>
					{editingTicketType ? 'Edit Ticket Type' : 'Create Ticket Type'}
				</Dialog.Title>
			</Dialog.Header>

			<form onsubmit={submitForm} class="space-y-4">
				<div>
					<Label for="name">Name *</Label>
					<Input
						id="name"
						bind:value={name}
						placeholder="e.g., General Admission, VIP"
						required
					/>
				</div>

				<div>
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={description}
						placeholder="Optional description of this ticket type"
						rows="3"
					/>
				</div>

				<div>
					<Label for="price">Price ({getCurrency(currency)?.name || currency.toUpperCase()}) *</Label>
					<div class="space-y-2">
						<Input
							id="price"
							type="number"
							step={getCurrency(currency)?.decimalPlaces === 0 ? "1" : "0.01"}
							min="0"
							bind:value={price}
							placeholder={getCurrency(currency)?.decimalPlaces === 0 ? "100" : "25.00"}
							required
						/>
						<p class="text-xs text-muted-foreground">
							{getMinimumAmountText(currency)}
						</p>
					</div>
				</div>

				<div>
					<Label for="quantity">Quantity Available</Label>
					<Input
						id="quantity"
						type="number"
						min="1"
						bind:value={quantityAvailable}
						placeholder="Leave empty for unlimited"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<Label for="saleStart">Sale Start Date</Label>
						<Input
							id="saleStart"
							type="datetime-local"
							bind:value={saleStartDate}
						/>
					</div>

					<div>
						<Label for="saleEnd">Sale End Date</Label>
						<Input
							id="saleEnd"
							type="datetime-local"
							bind:value={saleEndDate}
						/>
					</div>
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<Button 
						type="button" 
						variant="outline"
						onclick={() => dialogOpen = false}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : 'Save'}
					</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>