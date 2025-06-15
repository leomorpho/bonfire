import type { HttpClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Create a new ticket type for an event
 */
export async function createTicketType(
	client: HttpClient,
	eventId: string,
	ticketTypeData: {
		name: string;
		description?: string;
		price: number; // in smallest unit (cents, pence, etc)
		currency?: string;
		quantity_available?: number;
		sale_start_date?: Date;
		sale_end_date?: Date;
	}
): Promise<any> {
	// Get the event to inherit its currency
	const event = await client.fetchOne(
		client.query('events').Where([['id', '=', eventId]])
	);
	
	if (!event) {
		throw new Error('Event not found');
	}
	
	const currency = ticketTypeData.currency || event.ticket_currency || 'usd';
	
	return await client.insert('ticket_types', {
		event_id: eventId,
		name: ticketTypeData.name,
		description: ticketTypeData.description || null,
		price: ticketTypeData.price,
		currency: currency,
		quantity_available: ticketTypeData.quantity_available || null,
		quantity_sold: 0,
		is_active: true,
		sale_start_date: ticketTypeData.sale_start_date || null,
		sale_end_date: ticketTypeData.sale_end_date || null,
		created_at: new Date(),
		updated_at: new Date()
	});
}

/**
 * Update an existing ticket type
 */
export async function updateTicketType(
	client: HttpClient,
	ticketTypeId: string,
	updates: Partial<{
		name: string;
		description: string;
		price: number;
		currency: string;
		quantity_available: number;
		is_active: boolean;
		sale_start_date: Date;
		sale_end_date: Date;
	}>
): Promise<any> {
	return await client.update('ticket_types', ticketTypeId, (ticketType) => {
		if (updates.name !== undefined) ticketType.name = updates.name;
		if (updates.description !== undefined) ticketType.description = updates.description;
		if (updates.price !== undefined) ticketType.price = updates.price;
		if (updates.currency !== undefined) ticketType.currency = updates.currency;
		if (updates.quantity_available !== undefined) ticketType.quantity_available = updates.quantity_available;
		if (updates.is_active !== undefined) ticketType.is_active = updates.is_active;
		if (updates.sale_start_date !== undefined) ticketType.sale_start_date = updates.sale_start_date;
		if (updates.sale_end_date !== undefined) ticketType.sale_end_date = updates.sale_end_date;
		ticketType.updated_at = new Date();
	});
}

/**
 * Get all ticket types for an event
 */
export async function getEventTicketTypes(
	client: WorkerClient | HttpClient,
	eventId: string
): Promise<any[]> {
	return await client.fetch(
		client.query('ticket_types').Where([['event_id', '=', eventId]]).Order('created_at', 'ASC')
	);
}

/**
 * Get available ticket types (active and within sale period)
 */
export async function getAvailableTicketTypes(
	client: WorkerClient | HttpClient,
	eventId: string
): Promise<any[]> {
	const now = new Date();
	const ticketTypes = await client.fetch(
		client.query('ticket_types')
			.Where([['event_id', '=', eventId]])
			.Where([['is_active', '=', true]])
			.Order('created_at', 'ASC')
	);

	// Filter by sale dates on the client side since Triplit might not support complex date filtering
	return ticketTypes.filter((ticketType) => {
		const saleStarted = !ticketType.sale_start_date || ticketType.sale_start_date <= now;
		const saleNotEnded = !ticketType.sale_end_date || ticketType.sale_end_date >= now;
		const hasAvailability = !ticketType.quantity_available || ticketType.quantity_sold < ticketType.quantity_available;
		
		return saleStarted && saleNotEnded && hasAvailability;
	});
}

/**
 * Check if a user can purchase more tickets for an event
 */
export async function canUserPurchaseTickets(
	client: WorkerClient | HttpClient,
	userId: string,
	eventId: string,
	requestedQuantity: number
): Promise<{ canPurchase: boolean; reason?: string; currentTicketCount: number }> {
	// Get the event to check max_tickets_per_user
	const event = await client.fetchOne(
		client.query('events').Where([['id', '=', eventId]])
	);

	if (!event) {
		return { canPurchase: false, reason: 'Event not found', currentTicketCount: 0 };
	}

	if (!event.is_ticketed) {
		return { canPurchase: false, reason: 'Event is not ticketed', currentTicketCount: 0 };
	}

	// Count current tickets owned by user for this event
	const currentTickets = await client.fetch(
		client.query('tickets')
			.Where([['user_id', '=', userId]])
			.Where([['ticket_type.event_id', '=', eventId]])
			.Where([['status', '=', 'active']])
	);

	const currentTicketCount = currentTickets.length;
	const maxTicketsPerUser = event.max_tickets_per_user || 5;

	if (currentTicketCount + requestedQuantity > maxTicketsPerUser) {
		return {
			canPurchase: false,
			reason: `Cannot exceed maximum of ${maxTicketsPerUser} tickets per user`,
			currentTicketCount
		};
	}

	return { canPurchase: true, currentTicketCount };
}

/**
 * Create tickets after successful payment
 */
export async function createTicketsForPurchase(
	client: HttpClient,
	purchaseId: string,
	ticketTypeId: string,
	userId: string,
	quantity: number,
	pricePerTicket: number,
	currency: string = 'usd'
): Promise<any[]> {
	const tickets = [];
	
	for (let i = 0; i < quantity; i++) {
		const ticket = await client.insert('tickets', {
			ticket_type_id: ticketTypeId,
			user_id: userId,
			purchase_id: purchaseId,
			status: 'active',
			purchase_price: pricePerTicket,
			currency: currency,
			purchased_at: new Date(),
			used_at: null,
			metadata: null
		});
		tickets.push(ticket);
	}

	// Update ticket type sold count
	await client.update('ticket_types', ticketTypeId, (ticketType) => {
		ticketType.quantity_sold += quantity;
		ticketType.updated_at = new Date();
	});

	return tickets;
}

/**
 * Get user's tickets for an event
 */
export async function getUserEventTickets(
	client: WorkerClient | HttpClient,
	userId: string,
	eventId: string
): Promise<any[]> {
	return await client.fetch(
		client.query('tickets')
			.Where([['user_id', '=', userId]])
			.Where([['ticket_type.event_id', '=', eventId]])
			.Include('ticket_type')
			.Order('purchased_at', 'DESC')
	);
}

/**
 * Mark tickets as used (for scanning/check-in)
 */
export async function markTicketsAsUsed(
	client: HttpClient,
	ticketIds: string[]
): Promise<void> {
	for (const ticketId of ticketIds) {
		await client.update('tickets', ticketId, (ticket) => {
			ticket.status = 'used';
			ticket.used_at = new Date();
		});
	}
}

/**
 * Get ticket purchase statistics for an event
 */
export async function getEventTicketStats(
	client: WorkerClient | HttpClient,
	eventId: string
): Promise<{
	totalTicketsSold: number;
	totalRevenue: number;
	ticketTypeStats: Array<{
		ticketType: any;
		sold: number;
		revenue: number;
	}>;
}> {
	const ticketTypes = await getEventTicketTypes(client, eventId);
	const purchases = await client.fetch(
		client.query('ticket_purchases')
			.Where([['event_id', '=', eventId]])
			.Where([['status', '=', 'completed']])
	);

	let totalTicketsSold = 0;
	let totalRevenue = 0;

	const ticketTypeStats = ticketTypes.map(ticketType => {
		const sold = ticketType.quantity_sold || 0;
		const revenue = sold * ticketType.price;
		
		totalTicketsSold += sold;
		totalRevenue += revenue;

		return {
			ticketType,
			sold,
			revenue
		};
	});

	return {
		totalTicketsSold,
		totalRevenue,
		ticketTypeStats
	};
}