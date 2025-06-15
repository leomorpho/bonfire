<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import { formatPrice } from '$lib/currencies';
	import { Ticket, Clock, ShoppingCart } from 'lucide-svelte';

	let { eventId, ticketTypes = [], open = $bindable(false), onTicketsPurchased } = $props();

	let selectedTicketType = $state(null);
	let quantity = $state(1);
	let isCreatingHold = $state(false);
	let holdInfo = $state(null);
	let timeRemaining = $state(0);
	let countdownInterval = $state(null);

	// Reset state when dialog opens/closes
	$effect(() => {
		if (!open) {
			resetState();
		}
	});

	function resetState() {
		selectedTicketType = null;
		quantity = 1;
		holdInfo = null;
		timeRemaining = 0;
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
	}

	function startCountdown(expiresAt: string) {
		const updateCountdown = () => {
			const now = new Date().getTime();
			const expiry = new Date(expiresAt).getTime();
			const remaining = Math.max(0, expiry - now);

			timeRemaining = Math.floor(remaining / 1000);

			if (remaining <= 0) {
				clearInterval(countdownInterval);
				holdInfo = null;
				toast.error('Your ticket hold has expired. Please try again.');
			}
		};

		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);
	}

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	async function createHold() {
		if (!selectedTicketType || quantity < 1) {
			toast.error('Please select a ticket type and quantity');
			return;
		}

		isCreatingHold = true;
		try {
			const response = await fetch('/api/tickets/hold', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticketTypeId: selectedTicketType.id,
					quantity
				})
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to reserve tickets');
				return;
			}

			const data = await response.json();
			holdInfo = data;
			startCountdown(data.expiresAt);
			toast.success(`Reserved ${quantity} ticket(s) for 10 minutes`);
		} catch (error) {
			console.error('Error creating hold:', error);
			toast.error('Failed to reserve tickets');
		} finally {
			isCreatingHold = false;
		}
	}

	async function proceedToPayment() {
		if (!holdInfo) return;

		try {
			const response = await fetch('/api/tickets/purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					ticketTypeId: selectedTicketType.id,
					quantity,
					holdId: holdInfo.hold.id
				})
			});

			if (!response.ok) {
				const error = await response.json();
				toast.error(error.error || 'Failed to create payment');
				return;
			}

			const data = await response.json();

			// Redirect to Stripe checkout
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			}
		} catch (error) {
			console.error('Error creating payment:', error);
			toast.error('Failed to proceed to payment');
		}
	}

	function getTotalPrice() {
		if (!selectedTicketType || !quantity) return 0;
		return selectedTicketType.price * quantity;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Ticket class="h-5 w-5" />
				Purchase Tickets
			</Dialog.Title>
			<Dialog.Description>
				This event requires tickets. Please purchase your tickets to RSVP.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if !holdInfo}
				<!-- Ticket Selection -->
				<div class="space-y-4">
					<div>
						<Label for="ticket-type">Select Ticket Type</Label>
						<Select.Root bind:selected={selectedTicketType}>
							<Select.Trigger id="ticket-type">
								<Select.Value placeholder="Choose a ticket type" />
							</Select.Trigger>
							<Select.Content>
								{#each ticketTypes as ticketType}
									<Select.Item value={ticketType}>
										<div class="flex w-full items-center justify-between">
											<div class="flex flex-col">
												<span class="font-medium">{ticketType.name}</span>
												{#if ticketType.description}
													<span class="text-xs text-muted-foreground">{ticketType.description}</span
													>
												{/if}
											</div>
											<span class="font-semibold">
												{formatPrice(ticketType.price, ticketType.currency)}
											</span>
										</div>
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if selectedTicketType}
						<div class="space-y-4">
							<div>
								<Label for="quantity">Number of Tickets</Label>
								<Input
									id="quantity"
									type="number"
									min="1"
									max="10"
									bind:value={quantity}
									class="w-full"
									placeholder="How many tickets?"
								/>
								<p class="mt-1 text-xs text-gray-500">
									Maximum {selectedTicketType.quantity_available || 'unlimited'} available
								</p>
							</div>

							<Card.Root>
								<Card.Content class="p-4">
									<div class="space-y-2">
										<div class="flex justify-between text-sm">
											<span>Price per ticket:</span>
											<span
												>{formatPrice(selectedTicketType.price, selectedTicketType.currency)}</span
											>
										</div>
										<div class="flex justify-between text-sm">
											<span>Quantity:</span>
											<span>{quantity}</span>
										</div>
										<hr class="my-2" />
										<div class="flex items-center justify-between">
											<span class="font-medium">Total:</span>
											<span class="text-lg font-bold">
												{formatPrice(getTotalPrice(), selectedTicketType.currency)}
											</span>
										</div>
									</div>
								</Card.Content>
							</Card.Root>

							<Button onclick={createHold} disabled={isCreatingHold || quantity < 1} class="w-full">
								{#if isCreatingHold}
									<div class="loading loading-spinner loading-xs mr-2"></div>
									Reserving Tickets...
								{:else}
									<ShoppingCart class="mr-2 h-4 w-4" />
									Reserve {quantity} Ticket{quantity === 1 ? '' : 's'}
								{/if}
							</Button>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Hold Created - Show Payment Options -->
				<div class="space-y-4">
					<Card.Root class="border-green-200 bg-green-50">
						<Card.Content class="p-4">
							<div class="mb-2 flex items-center gap-2 text-green-800">
								<Clock class="h-4 w-4" />
								<span class="font-medium">Tickets Reserved!</span>
							</div>
							<p class="text-sm text-green-700">
								You have reserved {quantity} × {selectedTicketType.name}
							</p>
							<p class="text-sm text-green-700">
								Time remaining: <span class="font-mono font-bold">{formatTime(timeRemaining)}</span>
							</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Content class="p-4">
							<div class="space-y-2">
								<div class="flex justify-between">
									<span>Ticket Type:</span>
									<span class="font-medium">{selectedTicketType.name}</span>
								</div>
								<div class="flex justify-between">
									<span>Quantity:</span>
									<span class="font-medium">{quantity}</span>
								</div>
								<div class="flex justify-between">
									<span>Price per ticket:</span>
									<span class="font-medium">
										{formatPrice(selectedTicketType.price, selectedTicketType.currency)}
									</span>
								</div>
								<hr class="my-2" />
								<div class="flex items-center justify-between">
									<span class="font-bold">Total:</span>
									<span class="text-lg font-bold">
										{formatPrice(getTotalPrice(), selectedTicketType.currency)}
									</span>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<div class="flex gap-2">
						<Button
							variant="outline"
							onclick={() => {
								holdInfo = null;
								if (countdownInterval) {
									clearInterval(countdownInterval);
									countdownInterval = null;
								}
							}}
							class="flex-1"
						>
							Cancel
						</Button>
						<Button onclick={proceedToPayment} class="flex-1">Proceed to Payment</Button>
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
