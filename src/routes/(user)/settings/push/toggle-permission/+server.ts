import { toggleNotificationPermission } from '$lib/server/push.js';

export async function POST({ request, locals }) {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
		}

		const { type } = await request.json();

		const newValue = await toggleNotificationPermission(userId, type);

		return new Response(JSON.stringify({ success: true, newValue }), { status: 200 });
	} catch (error) {
		console.error('Error updating permissions:', error);
		return new Response(JSON.stringify({ error: 'Failed to update permissions' }), { status: 500 });
	}
}
