import { db } from '$lib/server/database/db';
import { notificationPermissionTable, pushSubscriptionTable } from '$lib/server/database/schema';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	const userId = locals.user?.id;

	if (!userId) {
		return { status: 401, body: { error: 'User not authenticated' } };
	}

	// Get push subscriptions for the user
	const subscriptions = await db
		.Select()
		.from(pushSubscriptionTable)
		.Where(eq(pushSubscriptionTable.userId, userId));

	// Get notification permissions for the user
	const permissions = await db
		.Select()
		.from(notificationPermissionTable)
		.Where(eq(notificationPermissionTable.userId, userId))
		.limit(1);

	return {
		subscriptions,
		permissions: permissions[0] || { oneDayReminder: false, eventActivity: false }
	};
}
