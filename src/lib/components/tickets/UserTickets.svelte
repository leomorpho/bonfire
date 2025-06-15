<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Ticket, CheckCircle, Calendar, DollarSign } from 'lucide-svelte';
	import { formatPrice } from '$lib/currencies';

	let { tickets = [], eventTitle = '' } = $props();

	function formatTicketPrice(priceInSmallestUnit, currencyCode) {
		return formatPrice(priceInSmallestUnit, currencyCode);
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusColor(status) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'used':
				return 'bg-blue-100 text-blue-800';
			case 'refunded':
				return 'bg-red-100 text-red-800';
			case 'transferred':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusText(status) {
		switch (status) {
			case 'active':
				return 'Valid';
			case 'used':
				return 'Used';
			case 'refunded':
				return 'Refunded';
			case 'transferred':
				return 'Transferred';
			default:
				return status;
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-2">
		<Ticket class="h-5 w-5" />
		<h3 class="text-lg font-semibold">Your Tickets</h3>
		{#if tickets.length > 0}
			<Badge variant="secondary">{tickets.length}</Badge>
		{/if}
	</div>

	{#if tickets.length === 0}
		<Card.Root>
			<Card.Content class="p-6 text-center">
				<Ticket class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
				<p class="text-muted-foreground">You don't have any tickets for this event yet.</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-3">
			{#each tickets as ticket (ticket.id)}
				<Card.Root class="transition-all hover:shadow-md">
					<Card.Content class="p-4">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="mb-2 flex items-center gap-2">
									<h4 class="font-semibold">
										{ticket.ticket_type?.name || 'Ticket'}
									</h4>
									<Badge class={getStatusColor(ticket.status)}>
										{getStatusText(ticket.status)}
									</Badge>
								</div>

								{#if ticket.ticket_type?.description}
									<p class="mb-2 text-sm text-muted-foreground">
										{ticket.ticket_type.description}
									</p>
								{/if}

								<div class="flex items-center gap-4 text-sm">
									<div class="flex items-center gap-1">
										<DollarSign class="h-4 w-4" />
										<span>{formatTicketPrice(ticket.purchase_price, ticket.currency)}</span>
									</div>

									<div class="flex items-center gap-1">
										<Calendar class="h-4 w-4" />
										<span>Purchased {formatDate(ticket.purchased_at)}</span>
									</div>

									{#if ticket.status === 'used' && ticket.used_at}
										<div class="flex items-center gap-1">
											<CheckCircle class="h-4 w-4" />
											<span>Used {formatDate(ticket.used_at)}</span>
										</div>
									{/if}
								</div>

								<div class="mt-3 rounded bg-muted p-2 font-mono text-xs">
									Ticket ID: {ticket.id}
								</div>
							</div>

							<div class="ml-4 text-right">
								<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
									<Ticket class="h-8 w-8 text-primary" />
								</div>
								<p class="mt-1 text-center text-xs text-muted-foreground">QR Code</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<div class="flex items-start gap-2">
				<Ticket class="mt-0.5 h-5 w-5 text-blue-600" />
				<div class="text-sm">
					<p class="mb-1 font-medium text-blue-900">Important Information</p>
					<ul class="space-y-1 text-blue-800">
						<li>• Please bring your ticket ID or a screenshot of this page to the event</li>
						<li>• QR code scanning will be available soon for easier check-in</li>
						<li>• Contact support if you have any issues with your tickets</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>
