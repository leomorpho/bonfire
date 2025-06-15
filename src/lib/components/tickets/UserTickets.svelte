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
				<Ticket class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
								<div class="flex items-center gap-2 mb-2">
									<h4 class="font-semibold">
										{ticket.ticket_type?.name || 'Ticket'}
									</h4>
									<Badge class={getStatusColor(ticket.status)}>
										{getStatusText(ticket.status)}
									</Badge>
								</div>

								{#if ticket.ticket_type?.description}
									<p class="text-sm text-muted-foreground mb-2">
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

								<div class="mt-3 p-2 bg-muted rounded text-xs font-mono">
									Ticket ID: {ticket.id}
								</div>
							</div>

							<div class="ml-4 text-right">
								<div class="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
									<Ticket class="h-8 w-8 text-primary" />
								</div>
								<p class="text-xs text-muted-foreground mt-1 text-center">
									QR Code
								</p>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex items-start gap-2">
				<Ticket class="h-5 w-5 text-blue-600 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-blue-900 mb-1">Important Information</p>
					<ul class="text-blue-800 space-y-1">
						<li>• Please bring your ticket ID or a screenshot of this page to the event</li>
						<li>• QR code scanning will be available soon for easier check-in</li>
						<li>• Contact support if you have any issues with your tickets</li>
					</ul>
				</div>
			</div>
		</div>
	{/if}
</div>