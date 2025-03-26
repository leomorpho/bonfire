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
		.select()
		.from(pushSubscriptionTable)
		.where(eq(pushSubscriptionTable.userId, userId));

	// Get notification permissions for the user
	const permissions = await db
		.select()
		.from(notificationPermissionTable)
		.where(eq(notificationPermissionTable.userId, userId))
		.limit(1);

	return {
		subscriptions,
		permissions: permissions[0] || { oneDayReminder: false, eventActivity: false }
	};
}
