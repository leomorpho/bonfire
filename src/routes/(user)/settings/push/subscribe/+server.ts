import { db } from '$lib/server/database/db';
import { pushSubscriptionTable } from '$lib/server/database/schema';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	try {
		// Extract subscription data and the current user ID
		const subscription = await request.json();
		const userId = locals.user?.id; // Assuming user info is in `locals`

		if (!userId) {
			return json({ success: false, message: 'User not authenticated' }, { status: 401 });
		}

		// Save the subscription to the database
		await db
			.insert(pushSubscriptionTable)
			.values({
				userId,
				endpoint: subscription.endpoint,
				p256dh: subscription.keys.p256dh,
				auth: subscription.keys.auth
			})
			.execute();

		return json({ success: true, message: 'Subscription saved successfully' });
	} catch (error) {
		console.error('Error saving subscription:', error);
		return json({ success: false, message: 'Failed to save subscription' }, { status: 500 });
	}
}
