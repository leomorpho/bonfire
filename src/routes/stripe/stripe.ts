import Stripe from 'stripe';
import { env as privateEnv } from '$env/dynamic/private';

//TODO: Update to latest stripe client but seems to cause error
export const stripeClient = new Stripe(privateEnv.STRIPE_SECRET_KEY, {
	apiVersion: '2024-04-10',
	httpClient: Stripe.createFetchHttpClient()
});
