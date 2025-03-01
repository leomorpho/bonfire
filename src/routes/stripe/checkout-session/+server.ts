import { json, type RequestEvent } from '@sveltejs/kit';
import { stripeClient } from '../stripe';
import { triplitHttpClient } from '$lib/server/triplit';

export async function POST({ url, request, locals }): Promise<Response> {
	const { price_id, mode } = await request.json();

	if (typeof price_id !== 'string') {
		return json({
			status: 400,
			error: {
				message: 'priceId is required'
			}
		});
	}
	const user = locals.user;
	if (!user) {
		throw new Error('user missing for checkout-session');
	}

	const userLogsTokenObject = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user_log_tokens').where(['user_id', '=', user.id]).build()
	);

	if (!userLogsTokenObject) {
		throw new Error('user_log_tokens entry missing for checkout-session');
	}

	let stripeCustomerId = userLogsTokenObject.stripe_customer_id;

	// 2️⃣ Create Stripe customer if one doesn't exist
	if (!stripeCustomerId) {
		const customer = await stripeClient.customers.create({
			email: user.email
		});
		stripeCustomerId = customer.id;

		// Store the Stripe Customer ID in the database
		await triplitHttpClient.update('user_log_tokens', userLogsTokenObject.id, (log) => {
			log.stripe_customer_id = stripeCustomerId;
		});
	}
	try {
		const session = await stripeClient.checkout.sessions.create({
			customer: stripeCustomerId,
			mode,
			payment_method_types: ['card'],
			line_items: [
				{
					price: price_id,
					quantity: 1
				}
			],

			success_url: `${url.origin}/profile/?sessionId={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/profile`
		});
		if (!session.url) {
			throw new Error('No session URL');
		}
		// go to checkout session url in frontend to complete the payment
		// serverside redirect to strip give a cors error
		return json({ url: session.url });
	} catch (error) {
		console.error(error);
		return json({
			status: 500,
			error
		});
	}
}
