<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ShoppingCart, Ticket, DollarSign, Clock, Users } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { formatPrice, getCurrency } from '$lib/currencies';

	let {
		eventId,
		availableTicketTypes = [],
		userTicketCount = 0,
		maxTicketsPerUser = 5,
		isAuthenticated = false
	} = $props();

	let selectedTicketTypeId = $state('');
	let quantity = $state(1);
	let isPurchasing = $state(false);

	$effect(() => {
		// Reset selection when ticket types change
		if (availableTicketTypes.length > 0 && !selectedTicketTypeId) {
			selectedTicketTypeId = availableTicketTypes[0].id;
		}
	});

	let selectedTicketType = $derived(
		availableTicketTypes.find((tt) => tt.id === selectedTicketTypeId)
	);

	let totalPrice = $derived(selectedTicketType ? selectedTicketType.price * quantity : 0);

	let maxQuantity = $derived(() => {
		if (!selectedTicketType) return 0;

		const remainingUserSlots = maxTicketsPerUser - userTicketCount;
		const availableTickets = selectedTicketType.quantity_available
			? selectedTicketType.quantity_available - selectedTicketType.quantity_sold
			: Infinity;

		return Math.min(remainingUserSlots, availableTickets, 10); // Cap at 10 for UI
	});

	function formatTicketPrice(priceInSmallestUnit, currencyCode) {
		return formatPrice(priceInSmallestUnit, currencyCode);
	}

	function formatDate(dateString) {
		if (!dateString) return null;
		return new Date(dateString).toLocaleDateString();
	}

	function isTicketTypeAvailable(ticketType) {
		const now = new Date();
		const saleStarted = !ticketType.sale_start_date || new Date(ticketType.sale_start_date) <= now;
		const saleNotEnded = !ticketType.sale_end_date || new Date(ticketType.sale_end_date) >= now;
		const hasAvailability =
			!ticketType.quantity_available || ticketType.quantity_sold < ticketType.quantity_available;

		return saleStarted && saleNotEnded && hasAvailability;
	}

	async function purchaseTickets() {
		if (!isAuthenticated) {
			toast.error('Please log in to purchase tickets');
			goto('/login');
			return;
		}

		if (!selectedTicketType || quantity <= 0) {
			toast.error('Please select a valid ticket type and quantity');
			return;
		}

		if (quantity > maxQuantity) {
			toast.error(`You can only purchase up to ${maxQuantity} more tickets`);
			return;
		}

		isPurchasing = true;

		try {
			const response = await fetch('/api/tickets/purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					eventId,
					ticketTypeId: selectedTicketTypeId,
					quantity
				})
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to create purchase');
				return;
			}

			const result = await response.json();

			// Redirect to Stripe checkout
			if (result.checkout_url) {
				window.location.href = result.checkout_url;
			} else {
				toast.error('Failed to create checkout session');
			}
		} catch (error) {
			console.error('Error purchasing tickets:', error);
			toast.error('Failed to purchase tickets');
		} finally {
			isPurchasing = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-2">
		<ShoppingCart class="h-5 w-5" />
		<h3 class="text-lg font-semibold">Purchase Tickets</h3>
	</div>

	{#if !isAuthenticated}
		<Card.Root class="border-amber-200 bg-amber-50">
			<Card.Content class="p-4">
				<p class="text-amber-800">
					Please <a href="/login" class="font-medium underline">log in</a> to purchase tickets.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if userTicketCount >= maxTicketsPerUser}
		<Card.Root class="border-red-200 bg-red-50">
			<Card.Content class="p-4">
				<p class="text-red-800">
					You have reached the maximum of {maxTicketsPerUser} tickets for this event.
				</p>
			</Card.Content>
		</Card.Root>
	{:else if availableTicketTypes.length === 0}
		<Card.Root>
			<Card.Content class="p-6 text-center">
				<Ticket class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
				<p class="text-muted-foreground">No tickets are currently available for purchase.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Ticket class="h-5 w-5" />
					Select Tickets
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Ticket Type Selection -->
				<div>
					<Label for="ticketType">Ticket Type</Label>
					<Select.Root bind:selected={selectedTicketTypeId}>
						<Select.Trigger id="ticketType">
							<Select.Value placeholder="Choose a ticket type" />
						</Select.Trigger>
						<Select.Content>
							{#each availableTicketTypes as ticketType (ticketType.id)}
								<Select.Item value={ticketType.id}>
									<div class="flex w-full items-center justify-between">
										<div>
											<span class="font-medium">{ticketType.name}</span>
											{#if ticketType.description}
												<div class="text-sm text-muted-foreground">
													{ticketType.description}
												</div>
											{/if}
										</div>
										<span class="ml-4 font-medium">
											{formatTicketPrice(ticketType.price, ticketType.currency)}
										</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Selected Ticket Details -->
				{#if selectedTicketType}
					<div class="space-y-2 rounded-lg bg-muted p-4">
						<div class="flex items-center justify-between">
							<span class="font-medium">{selectedTicketType.name}</span>
							<span class="font-bold"
								>{formatTicketPrice(selectedTicketType.price, selectedTicketType.currency)} each</span
							>
						</div>

						{#if selectedTicketType.description}
							<p class="text-sm text-muted-foreground">{selectedTicketType.description}</p>
						{/if}

						<div class="flex items-center gap-4 text-sm">
							{#if selectedTicketType.quantity_available}
								<div class="flex items-center gap-1">
									<Users class="h-4 w-4" />
									<span>
										{selectedTicketType.quantity_available - selectedTicketType.quantity_sold} available
									</span>
								</div>
							{/if}

							{#if selectedTicketType.sale_end_date}
								<div class="flex items-center gap-1">
									<Clock class="h-4 w-4" />
									<span>Sale ends {formatDate(selectedTicketType.sale_end_date)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Quantity Selection -->
				<div>
					<Label for="quantity">Quantity</Label>
					<Select.Root bind:selected={quantity}>
						<Select.Trigger id="quantity">
							<Select.Value />
						</Select.Trigger>
						<Select.Content>
							{#each Array(maxQuantity).fill(0) as _, i}
								<Select.Item value={i + 1}>{i + 1}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>

					{#if userTicketCount > 0}
						<p class="mt-1 text-sm text-muted-foreground">
							You currently have {userTicketCount} ticket{userTicketCount === 1 ? '' : 's'} for this
							event. You can purchase {maxTicketsPerUser - userTicketCount} more.
						</p>
					{/if}
				</div>

				<!-- Total Price -->
				<div class="flex items-center justify-between rounded-lg bg-primary/10 p-4">
					<span class="font-medium">Total Price:</span>
					<span class="flex items-center gap-1 text-xl font-bold">
						{formatTicketPrice(totalPrice, selectedTicketType?.currency || 'usd')}
					</span>
				</div>

				<!-- Purchase Button -->
				<Button
					onclick={purchaseTickets}
					disabled={isPurchasing || !selectedTicketType || quantity <= 0 || quantity > maxQuantity}
					class="w-full"
					size="lg"
				>
					{#if isPurchasing}
						Processing...
					{:else}
						Purchase {quantity} Ticket{quantity === 1 ? '' : 's'}
					{/if}
				</Button>

				<p class="text-center text-xs text-muted-foreground">
					You will be redirected to Stripe to complete your purchase securely.
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
