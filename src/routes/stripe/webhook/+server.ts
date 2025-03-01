import { json, type RequestEvent } from '@sveltejs/kit';
import { stripeClient } from '../stripe';

import { env as privateEnv } from '$env/dynamic/private';
import { handleLogPurchaseWebhook } from '$lib/payments';
import { triplitHttpClient } from '$lib/server/triplit';

function toBuffer(ab: ArrayBuffer): Buffer {
	const buf = Buffer.alloc(ab.byteLength);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; i++) {
		buf[i] = view[i];
	}
	return buf;
}

export async function POST(event: RequestEvent) {
	// export async function post(req: Request<any, { data: any; type: any }>): Promise<Response> {
	const req = event.request;
	let stripeEvent;
	// let data;
	let eventType: string;
	if (privateEnv.STRIPE_WEBHOOK_SECRET) {
		// let event;
		const _rawBody = await req.arrayBuffer();
		const payload = toBuffer(_rawBody);

		// SvelteKit may sometimes modify the incoming request body
		// However, Stripe requires the exact body it sends to construct an Event
		// To avoid unintended SvelteKit modifications, we can use this workaround:
		// const payload = Buffer.from(req.rawBody);
		const signature = req.headers.get('stripe-signature') as string;
		try {
			stripeEvent = stripeClient.webhooks.constructEvent(
				payload,
				signature,
				privateEnv.STRIPE_WEBHOOK_SECRET
			);
			console.debug('stripe event ========>', stripeEvent);
			//const data = event.data;
			eventType = stripeEvent.type;
		} catch (err) {
			console.error(err);
			return {
				status: 500,
				headers: {},
				body: JSON.stringify({
					error: err
				})
			};
		}
	} else {
		// data = req.body.data;
		eventType = ((await req.formData()).get('type') as string).toString();
	}

	switch (eventType) {
		case 'checkout.session.completed': {
			// Payment is successful and the subscription is created.
			// You should provision the subscription and save the customer ID to your database.
			console.log('Event: checkout.session.completed');

			// Fetch session details, including line items
			const sessionId = stripeEvent?.data.object.id;

			const session = await stripeClient.checkout.sessions.retrieve(sessionId, {
				expand: ['line_items']
			});
			const paymentIntentId = session.payment_intent;
			const customerId = session.customer?.toString();

			if (!customerId) {
				throw new Error(`purchase is missing customerId. Payment Intent ID: ${paymentIntentId}`);
			}
			// Extract purchased items
			const lineItems = session.line_items?.data || [];

			if (lineItems.length > 0) {
				const firstItem = lineItems[0]; // Since only 1 item is purchased at a time
				const priceId = firstItem.price?.id;
				const productId = firstItem.price?.product.toString();
				const quantity = Number(firstItem.quantity ?? 1);
				const totalAmount = session.amount_total; // Total amount paid (in smallest currency unit, e.g., cents)
				const currency = session.currency; // Currency (e.g., "usd")

				console.log(
					`✅ Purchased item - Product ID: ${productId}, Price ID: ${priceId}, Quantity: ${quantity}, Payment Intent ID: ${paymentIntentId}, Customer ID: ${customerId}, TotalAmount: ${totalAmount}, Currency: ${currency}`
				);

				// Update the user's log balance using product ID
				await handleLogPurchaseWebhook(
					triplitHttpClient,
					customerId,
					paymentIntentId as string,
					priceId as string,
					quantity,
					totalAmount,
					currency
				);
			} else {
				console.error('❌ No items found in the Stripe checkout session.');
			}

			break;
		}
		case 'invoice.paid':
			// Continue to provision the subscription as payments continue to be made.
			// Store the status in your database and check when a user accesses your service.
			// This approach helps you avoid hitting rate limits.
			console.log('Event: invoice.paid');
			break;
		case 'invoice.payment_failed':
			// The payment failed or the customer does not have a valid payment method.
			// The subscription becomes past_due. Notify your customer and send them to the
			// customer portal to update their payment information.
			console.log('Event: invoice.payment_failed');
			break;

		case 'customer.subscription.updated':
			// Listen to this to monitor updates to the subscription quantity.
			// When you receive this event, check the subscription.items.data[0].quantity
			// attribute to find the quantity the customer is subscribed to.
			// Then, grant access to the new quantity.

			console.log('Event: customer.subscription.updated');
			break;
		case 'customer.subscription.deleted':
			// Listen to this to monitor subscription cancellations. When you receive this event,
			// revoke the customer’s access to the product.If you configure the portal to cancel
			// subscriptions at the end of a billing period, listen to the customer.subscription.
			// updated event to be notified of cancellations before they occur.
			// If cancel_at_period_end is true, the subscription is canceled at the end of its billing period.
			// If a customer changes their mind, they can reactivate their subscription prior to
			// the end of the billing period.When they do this, a customer.subscription.updated
			// event is sent.Check that cancel_at_period_end is false to confirm that they
			// reactivated their subscription.

			console.log('Event: customer.subscription.deleted');
			break;
		default:
			// Unhandled event type
			console.log(eventType);
	}

	return json({ received: true });
}
