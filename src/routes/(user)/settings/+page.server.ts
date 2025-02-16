import { getNotificationPermissions, getPushSubscriptions } from '$lib/server/push';

export async function load({ locals }) {
	const userId = locals.user?.id;

	if (!userId) {
		return { status: 401, body: { error: 'User not authenticated' } };
	}

	// Get push subscriptions for the user
	const subscriptions = await getPushSubscriptions(userId);

	// Get notification permissions for the user
	const permissions = await getNotificationPermissions(userId);

	return {
		subscriptions,
		permissions: permissions[0] || { oneDayReminder: false, eventActivity: false }
	};
}
