import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import {
	createTicketHold,
	removeUserTicketHolds,
	getUserTicketHold,
	getTicketAvailability
} from '$lib/server/tickets';

// POST - Create a ticket hold
export async function POST({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { ticketTypeId, quantity } = body;

		if (!ticketTypeId || !quantity || quantity < 1) {
			return json({ error: 'ticketTypeId and quantity (>0) are required' }, { status: 400 });
		}

		// Get ticket type to check event permissions
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('ticket_types')
				.Where([['id', '=', ticketTypeId]])
				.Include('event')
		);

		if (!ticketType) {
			return json({ error: 'Ticket type not found' }, { status: 404 });
		}

		if (!ticketType.event.is_ticketed) {
			return json({ error: 'Event is not ticketed' }, { status: 400 });
		}

		if (!ticketType.is_active) {
			return json({ error: 'Ticket type is not active' }, { status: 400 });
		}

		// Check if sales period is active
		const now = new Date();
		if (ticketType.sale_start_date && ticketType.sale_start_date > now) {
			return json({ error: 'Ticket sales have not started yet' }, { status: 400 });
		}
		if (ticketType.sale_end_date && ticketType.sale_end_date < now) {
			return json({ error: 'Ticket sales have ended' }, { status: 400 });
		}

		// Check max tickets per user limit
		const event = ticketType.event;
		if (event.max_tickets_per_user) {
			// Count user's existing tickets for this event
			const userTickets = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('tickets')
					.Where([['user_id', '=', user.id]])
					.Where([['ticket_type.event_id', '=', event.id]])
					.Where([['status', '=', 'active']])
			);

			const currentTicketCount = userTickets.length;
			if (currentTicketCount + quantity > event.max_tickets_per_user) {
				return json(
					{
						error: `Cannot exceed maximum of ${event.max_tickets_per_user} tickets per user. You currently have ${currentTicketCount} tickets.`
					},
					{ status: 400 }
				);
			}
		}

		// Create the hold
		const result = await createTicketHold(triplitHttpClient, user.id, ticketTypeId, quantity);

		if ('error' in result) {
			return json({ error: result.error }, { status: 400 });
		}

		return json(
			{
				hold: result.hold,
				available: result.available,
				expiresAt: result.hold.expires_at
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating ticket hold:', error);
		return json({ error: 'Failed to create ticket hold' }, { status: 500 });
	}
}

// GET - Get user's current hold for a ticket type
export async function GET({ url, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const ticketTypeId = url.searchParams.get('ticketTypeId');
	if (!ticketTypeId) {
		return json({ error: 'ticketTypeId is required' }, { status: 400 });
	}

	try {
		const hold = await getUserTicketHold(triplitHttpClient, user.id, ticketTypeId);
		const availability = await getTicketAvailability(triplitHttpClient, ticketTypeId);

		return json({
			hold,
			availability
		});
	} catch (error) {
		console.error('Error getting ticket hold:', error);
		return json({ error: 'Failed to get ticket hold' }, { status: 500 });
	}
}

// DELETE - Remove user's hold for a ticket type
export async function DELETE({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { ticketTypeId } = body;

		if (!ticketTypeId) {
			return json({ error: 'ticketTypeId is required' }, { status: 400 });
		}

		await removeUserTicketHolds(triplitHttpClient, user.id, ticketTypeId);

		return json({ success: true });
	} catch (error) {
		console.error('Error removing ticket hold:', error);
		return json({ error: 'Failed to remove ticket hold' }, { status: 500 });
	}
}
