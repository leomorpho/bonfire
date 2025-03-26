import { db } from '$lib/server/database/db';
import { pushSubscriptionTable } from '$lib/server/database/schema';
import { and, eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function POST({ request, locals }) {
	try {
		// Extract subscription endpoint and the current user ID
		const { endpoint } = await request.json();
		const userId = locals.user?.id; // Assuming user info is in `locals`

		if (!userId) {
			return json({ success: false, message: 'User not authenticated' }, { status: 401 });
		}

		if (!endpoint) {
			return json({ success: false, message: 'Endpoint is required' }, { status: 400 });
		}

		// Delete the subscription from the database
		const deleteResult = await db
			.delete(pushSubscriptionTable)
			.where(
				and(eq(pushSubscriptionTable.endpoint, endpoint), eq(pushSubscriptionTable.userId, userId))
			).execute();

		if (deleteResult.rowCount === 0) {
			return json({ success: false, message: 'Subscription not found' }, { status: 404 });
		}

		return json({ success: true, message: 'Subscription removed successfully' });
	} catch (error) {
		console.error('Error removing subscription:', error);
		return json({ success: false, message: 'Failed to remove subscription' }, { status: 500 });
	}
}
