import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';

// GET - Return Stripe publishable key for frontend
export async function GET() {
	return json({
		publicKey: privateEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY
	});
}