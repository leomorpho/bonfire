import { json, type RequestEvent } from '@sveltejs/kit';
import { stripeClient } from '../../../../stripe/stripe';
import { triplitHttpClient } from '$lib/server/triplit';
import { createTicketsForPurchase, convertHoldToTickets } from '$lib/server/tickets';
import { createUserAttendance } from '$lib/rsvp';
import { Status, NotificationType } from '$lib/enums';

const endpointSecret = process.env.STRIPE_TICKET_WEBHOOK_SECRET;

export async function POST({ request }: RequestEvent): Promise<Response> {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature || !endpointSecret) {
		console.error('Missing stripe signature or webhook secret');
		return json({ error: 'Webhook signature verification failed' }, { status: 400 });
	}

	let event;

	try {
		event = stripeClient.webhooks.constructEvent(body, signature, endpointSecret);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return json({ error: 'Webhook signature verification failed' }, { status: 400 });
	}

	console.log('Received Stripe webhook event:', event.type);

	try {
		switch (event.type) {
			case 'checkout.session.completed':
				await handleCheckoutSessionCompleted(event.data.object);
				break;
			case 'payment_intent.payment_failed':
				await handlePaymentFailed(event.data.object);
				break;
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}

async function handleCheckoutSessionCompleted(session: any) {
	try {
		const purchaseId = session.metadata?.purchase_id;
		const eventId = session.metadata?.event_id;
		const ticketTypeId = session.metadata?.ticket_type_id;
		const userId = session.metadata?.user_id;
		const quantity = parseInt(session.metadata?.quantity || '1');
		const holdId = session.metadata?.hold_id;

		if (!purchaseId || !eventId || !ticketTypeId || !userId) {
			console.error('Missing metadata in Stripe session:', session.metadata);
			return;
		}

		// Get the purchase record
		const purchase = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('ticket_purchases').Where([['id', '=', purchaseId]])
		);

		if (!purchase) {
			console.error('Purchase not found:', purchaseId);
			return;
		}

		if (purchase.status === 'completed') {
			console.log('Purchase already completed:', purchaseId);
			return;
		}

		// Get the ticket type for price information
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('ticket_types').Where([['id', '=', ticketTypeId]])
		);

		if (!ticketType) {
			console.error('Ticket type not found:', ticketTypeId);
			return;
		}

		// Update purchase status
		await triplitHttpClient.update('ticket_purchases', purchaseId, (p) => {
			p.status = 'completed';
			p.stripe_payment_intent_id = session.payment_intent;
		});

		// Create individual tickets, handling holds if present
		let tickets;
		if (holdId) {
			// Convert hold to tickets
			tickets = await convertHoldToTickets(
				triplitHttpClient,
				holdId,
				purchaseId,
				ticketType.price,
				ticketType.currency
			);
		} else {
			// Create tickets normally
			tickets = await createTicketsForPurchase(
				triplitHttpClient,
				purchaseId,
				ticketTypeId,
				userId,
				quantity,
				ticketType.price,
				ticketType.currency
			);
		}

		// Create or update attendee record - user is now going since they bought tickets
		try {
			await createUserAttendance(
				triplitHttpClient,
				userId,
				eventId,
				Status.GOING,
				0 // 0 guests for ticketed events
			);
		} catch (error) {
			// Attendance might already exist, that's ok
			console.log('Attendance already exists or error creating:', error);
		}

		// Create notification for ticket purchase confirmation
		const { formatPrice } = await import('$lib/currencies');
		const formattedTotal = formatPrice(purchase.total_amount, purchase.currency || 'usd');

		await triplitHttpClient.insert('notifications_queue', {
			user_id: userId,
			event_id: eventId,
			type: NotificationType.TICKET_PURCHASED,
			title: `Ticket Purchase Confirmed`,
			content: `Your ${quantity} ticket${quantity === 1 ? '' : 's'} for ${ticketType.name} have been confirmed. Total: ${formattedTotal}.`,
			object_id: purchaseId,
			object_type: NotificationType.TICKET_PURCHASED,
			created_at: new Date()
		});

		console.log(
			`✅ Successfully processed ticket purchase: ${quantity} tickets for user ${userId} at event ${eventId}`
		);
	} catch (error) {
		console.error('Error handling checkout session completed:', error);
		throw error;
	}
}

async function handlePaymentFailed(paymentIntent: any) {
	try {
		// Find purchase by payment intent
		const purchases = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('ticket_purchases')
				.Where([['stripe_payment_intent_id', '=', paymentIntent.id]])
		);

		for (const purchase of purchases) {
			await triplitHttpClient.update('ticket_purchases', purchase.id, (p) => {
				p.status = 'failed';
			});
		}

		console.log(`Payment failed for payment intent: ${paymentIntent.id}`);
	} catch (error) {
		console.error('Error handling payment failed:', error);
		throw error;
	}
}
