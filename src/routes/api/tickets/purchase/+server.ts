import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { canUserPurchaseTickets, getTicketAvailability } from '$lib/server/tickets';
import { stripeClient } from '../../../stripe/stripe';

// POST - Initiate ticket purchase (create Stripe checkout session)
export async function POST({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { eventId, ticketTypeId, quantity, holdId } = body;

		if (!ticketTypeId || !quantity) {
			return json({ error: 'ticketTypeId and quantity are required' }, { status: 400 });
		}

		if (quantity <= 0 || quantity > 20) {
			return json({ error: 'Quantity must be between 1 and 20' }, { status: 400 });
		}

		// Get the ticket type first to find the event
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('ticket_types')
				.Where([['id', '=', ticketTypeId]])
				.Include('event')
		);

		if (!ticketType) {
			return json({ error: 'Ticket type not found' }, { status: 404 });
		}

		const event = ticketType.event;
		if (!event) {
			return json({ error: 'Event not found' }, { status: 400 });
		}
		if (!event.is_ticketed) {
			return json({ error: 'Event is not ticketed' }, { status: 400 });
		}

		// If holdId is provided, verify the hold exists and belongs to this user
		let hold = null;
		if (holdId) {
			hold = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('ticket_holds')
					.Where([['id', '=', holdId]])
					.Where([['user_id', '=', user.id]])
			);

			if (!hold) {
				return json({ error: 'Hold not found or expired' }, { status: 400 });
			}

			if (hold.expires_at <= new Date()) {
				return json({ error: 'Hold has expired' }, { status: 400 });
			}

			if (hold.ticket_type_id !== ticketTypeId || hold.quantity !== quantity) {
				return json({ error: 'Hold details do not match purchase request' }, { status: 400 });
			}
		} else {
			// Without a hold, check availability normally
			const { canPurchase, reason } = await canUserPurchaseTickets(
				triplitHttpClient,
				user.id,
				event.id,
				quantity
			);

			if (!canPurchase) {
				return json({ error: reason }, { status: 400 });
			}

			// Check current availability
			const availability = await getTicketAvailability(triplitHttpClient, ticketTypeId);
			if (availability.available < quantity) {
				return json({ error: 'Not enough tickets available' }, { status: 400 });
			}
		}

		// Calculate total amount
		const totalAmount = ticketType.price * quantity;

		// Create pending purchase record
		const purchase = await triplitHttpClient.insert('ticket_purchases', {
			user_id: user.id,
			event_id: event.id,
			stripe_payment_intent_id: '', // Will be updated after Stripe session creation
			stripe_checkout_session_id: '',
			total_amount: totalAmount,
			currency: ticketType.currency,
			quantity: quantity,
			status: 'pending',
			purchased_at: new Date(),
			metadata: {
				ticket_type_id: ticketTypeId,
				ticket_type_name: ticketType.name,
				price_per_ticket: ticketType.price,
				hold_id: holdId || null
			}
		});

		// Create Stripe checkout session
		// Note: Stripe automatically handles currency conversions for international customers
		const stripeSession = await stripeClient.checkout.sessions.create({
			payment_method_types: ['card'],
			mode: 'payment',
			line_items: [
				{
					price_data: {
						currency: ticketType.currency.toLowerCase(), // Stripe requires lowercase currency codes
						product_data: {
							name: `${event.title} - ${ticketType.name}`,
							description: ticketType.description || `Ticket for ${event.title}`
						},
						unit_amount: ticketType.price // Must be in smallest unit for the currency
					},
					quantity: quantity
				}
			],
			success_url: `${process.env.ORIGIN}/bonfire/${event.id}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.ORIGIN}/bonfire/${event.id}?purchase=cancelled`,
			metadata: {
				purchase_id: purchase.id,
				event_id: event.id,
				ticket_type_id: ticketTypeId,
				user_id: user.id,
				quantity: quantity.toString(),
				currency: ticketType.currency,
				hold_id: holdId || ''
			},
			customer_email: user.email,
			// Allow customers to change currency if they prefer (Stripe handles conversion)
			allow_promotion_codes: true,
			billing_address_collection: 'auto'
		});

		// Update purchase with Stripe session ID
		await triplitHttpClient.update('ticket_purchases', purchase.id, (p) => {
			p.stripe_checkout_session_id = stripeSession.id;
		});

		return json({
			purchase_id: purchase.id,
			checkout_url: stripeSession.url,
			total_amount: totalAmount,
			currency: ticketType.currency
		});
	} catch (error) {
		console.error('Error creating ticket purchase:', error);
		return json({ error: 'Failed to create ticket purchase' }, { status: 500 });
	}
}
