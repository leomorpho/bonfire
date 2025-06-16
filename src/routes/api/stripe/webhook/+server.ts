import { json, type RequestEvent } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { stripeClient } from '../../../stripe/stripe';
import { triplitHttpClient } from '$lib/server/triplit';
import Stripe from 'stripe';

// POST - Handle Stripe webhook events
export async function POST({ request }: RequestEvent): Promise<Response> {
	let event: Stripe.Event;

	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');

		if (!signature) {
			console.error('Missing Stripe signature');
			return json({ error: 'Missing signature' }, { status: 400 });
		}

		// Verify webhook signature
		event = stripeClient.webhooks.constructEvent(body, signature, privateEnv.STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	try {
		// Handle the event based on type
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionCompleted(session);
				break;
			}

			case 'checkout.session.expired': {
				const session = event.data.object as Stripe.Checkout.Session;
				await handleCheckoutSessionExpired(session);
				break;
			}

			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				await handlePaymentIntentSucceeded(paymentIntent);
				break;
			}

			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				await handlePaymentIntentFailed(paymentIntent);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
	console.log('Checkout session completed:', session.id);

	const purchaseId = session.metadata?.purchase_id;
	const userId = session.metadata?.user_id;
	const eventId = session.metadata?.event_id;
	const ticketTypeId = session.metadata?.ticket_type_id;
	const quantity = parseInt(session.metadata?.quantity || '0');
	const holdId = session.metadata?.hold_id;

	if (!purchaseId || !userId || !eventId || !ticketTypeId || !quantity) {
		console.error('Missing required metadata in checkout session:', session.metadata);
		return;
	}

	try {
		// Update purchase status to completed
		await triplitHttpClient.update('ticket_purchases', purchaseId, (purchase) => {
			purchase.status = 'completed';
			purchase.stripe_payment_intent_id = (session.payment_intent as string) || '';
		});

		// Get ticket type to get price information
		const ticketType = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('ticket_types').Where([['id', '=', ticketTypeId]])
		);

		// Create individual tickets for the purchase
		const ticketPromises = [];
		for (let i = 0; i < quantity; i++) {
			ticketPromises.push(
				triplitHttpClient.insert('tickets', {
					user_id: userId,
					ticket_type_id: ticketTypeId,
					purchase_id: purchaseId,
					status: 'active',
					purchase_price: ticketType?.price || 0,
					currency: ticketType?.currency || 'usd',
					purchased_at: new Date()
				})
			);
		}

		await Promise.all(ticketPromises);

		// Clean up the hold if one exists (delete it since payment completed)
		if (holdId) {
			await triplitHttpClient.delete('ticket_holds', holdId);
		}

		// Create attendee record if user isn't already attending
		const existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('attendees')
				.Where([['user_id', '=', userId]])
				.Where([['event_id', '=', eventId]])
		);

		if (!existingAttendee) {
			await triplitHttpClient.insert('attendees', {
				user_id: userId,
				event_id: eventId,
				status: 'attending',
				updated_at: new Date()
			});
		} else {
			// Update existing attendee to 'attending'
			await triplitHttpClient.update('attendees', existingAttendee.id, (attendee) => {
				attendee.status = 'attending';
				attendee.updated_at = new Date();
			});
		}

		console.log(`Successfully processed ticket purchase: ${purchaseId} for user: ${userId}`);
	} catch (error) {
		console.error('Error updating purchase after successful payment:', error);
	}
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
	console.log('Checkout session expired:', session.id);

	const purchaseId = session.metadata?.purchase_id;
	const holdId = session.metadata?.hold_id;

	if (purchaseId) {
		try {
			// Update purchase status to failed
			await triplitHttpClient.update('ticket_purchases', purchaseId, (purchase) => {
				purchase.status = 'failed';
			});

			// Clean up the hold if one exists (delete it since session expired)
			if (holdId) {
				await triplitHttpClient.delete('ticket_holds', holdId);
			}

			console.log(`Checkout session expired, updated purchase: ${purchaseId}`);
		} catch (error) {
			console.error('Error updating expired checkout session:', error);
		}
	}
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
	console.log('Payment intent succeeded:', paymentIntent.id);
	// Additional processing if needed - most logic is handled in checkout.session.completed
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
	console.log('Payment intent failed:', paymentIntent.id);

	try {
		// Find purchases with this payment intent and mark them as failed
		const purchases = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('ticket_purchases')
				.Where([['stripe_payment_intent_id', '=', paymentIntent.id]])
		);

		for (const purchase of purchases) {
			await triplitHttpClient.update('ticket_purchases', purchase.id, (p) => {
				p.status = 'failed';
			});

			// Clean up any associated holds (delete them since payment failed)
			if (purchase.metadata?.hold_id) {
				await triplitHttpClient.delete('ticket_holds', purchase.metadata.hold_id);
			}
		}

		console.log(`Payment intent failed, updated ${purchases.length} purchases`);
	} catch (error) {
		console.error('Error handling failed payment intent:', error);
	}
}
