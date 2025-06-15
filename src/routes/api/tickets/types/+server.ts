import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { createTicketType, updateTicketType, getEventTicketTypes } from '$lib/server/tickets';
import { ALLOWED_EVENT_CURRENCIES } from '$lib/enums';

// GET - Get ticket types for an event
export async function GET({ url, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const eventId = url.searchParams.get('eventId');
	if (!eventId) {
		return json({ error: 'eventId is required' }, { status: 400 });
	}

	try {
		// Check if user has permission to view this event's ticket types
		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('events').Where([['id', '=', eventId]])
		);

		if (!event) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		// For now, allow all authenticated users to view ticket types (they'll need this to purchase)
		// Permissions are handled by Triplit schema

		const ticketTypes = await getEventTicketTypes(triplitHttpClient, eventId);
		return json({ ticketTypes });
	} catch (error) {
		console.error('Error fetching ticket types:', error);
		return json({ error: 'Failed to fetch ticket types' }, { status: 500 });
	}
}

// POST - Create a new ticket type
export async function POST({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { eventId, name, description, price, currency, quantity_available, sale_start_date, sale_end_date } = body;

		if (!eventId || !name || price === undefined) {
			return json({ error: 'eventId, name, and price are required' }, { status: 400 });
		}

		if (price < 0) {
			return json({ error: 'Price must be non-negative' }, { status: 400 });
		}

		// Validate currency if provided
		if (currency && !ALLOWED_EVENT_CURRENCIES.includes(currency.toLowerCase())) {
			return json({ error: 'Invalid currency. Please use one of the allowed currencies.' }, { status: 400 });
		}

		// Check if user has permission to create ticket types for this event
		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('events').Where([['id', '=', eventId]])
		);

		if (!event) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		// Check permissions (event creator or admin)
		if (event.user_id !== user.id) {
			const isAdmin = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('event_admins')
					.Where([['event_id', '=', eventId]])
					.Where([['user_id', '=', user.id]])
			);

			if (!isAdmin) {
				return json({ error: 'Permission denied' }, { status: 403 });
			}
		}

		const ticketType = await createTicketType(triplitHttpClient, eventId, {
			name,
			description,
			price,
			currency,
			quantity_available,
			sale_start_date: sale_start_date ? new Date(sale_start_date) : undefined,
			sale_end_date: sale_end_date ? new Date(sale_end_date) : undefined
		});

		return json({ ticketType }, { status: 201 });
	} catch (error) {
		console.error('Error creating ticket type:', error);
		return json({ error: 'Failed to create ticket type' }, { status: 500 });
	}
}

// PUT - Update a ticket type
export async function PUT({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { ticketTypeId, ...updates } = body;

		if (!ticketTypeId) {
			return json({ error: 'ticketTypeId is required' }, { status: 400 });
		}

		// Get the ticket type to check permissions
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('ticket_types')
				.Where([['id', '=', ticketTypeId]])
				.Include('event')
		);

		if (!ticketType) {
			return json({ error: 'Ticket type not found' }, { status: 404 });
		}

		// Check permissions
		if (ticketType.event.user_id !== user.id) {
			const isAdmin = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('event_admins')
					.Where([['event_id', '=', ticketType.event_id]])
					.Where([['user_id', '=', user.id]])
			);

			if (!isAdmin) {
				return json({ error: 'Permission denied' }, { status: 403 });
			}
		}

		// Convert date strings to Date objects if provided
		const processedUpdates = { ...updates };
		if (updates.sale_start_date) {
			processedUpdates.sale_start_date = new Date(updates.sale_start_date);
		}
		if (updates.sale_end_date) {
			processedUpdates.sale_end_date = new Date(updates.sale_end_date);
		}

		const updatedTicketType = await updateTicketType(triplitHttpClient, ticketTypeId, processedUpdates);

		return json({ ticketType: updatedTicketType });
	} catch (error) {
		console.error('Error updating ticket type:', error);
		return json({ error: 'Failed to update ticket type' }, { status: 500 });
	}
}

// DELETE - Delete a ticket type
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

		// Get the ticket type to check permissions and if it has sold tickets
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('ticket_types')
				.Where([['id', '=', ticketTypeId]])
				.Include('event')
		);

		if (!ticketType) {
			return json({ error: 'Ticket type not found' }, { status: 404 });
		}

		// Check permissions
		if (ticketType.event.user_id !== user.id) {
			const isAdmin = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('event_admins')
					.Where([['event_id', '=', ticketType.event_id]])
					.Where([['user_id', '=', user.id]])
			);

			if (!isAdmin) {
				return json({ error: 'Permission denied' }, { status: 403 });
			}
		}

		// Check if any tickets have been sold
		if (ticketType.quantity_sold > 0) {
			return json(
				{ error: 'Cannot delete ticket type with sold tickets. Disable it instead.' },
				{ status: 400 }
			);
		}

		await triplitHttpClient.delete('ticket_types', ticketTypeId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting ticket type:', error);
		return json({ error: 'Failed to delete ticket type' }, { status: 500 });
	}
}