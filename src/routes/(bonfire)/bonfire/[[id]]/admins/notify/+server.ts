import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createNewAdminNotificationQueueObject } from '$lib/notification';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

/**
 * Adds a new admin notification to the queue for a specific event.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		// Parse request body
		const { eventId, userId } = await request.json();
		if (!eventId || !userId) {
			return json({ error: 'Missing eventId or userId' }, { status: 400 });
		}

		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.Where(
					and([
						['user_id', '=', user.id],
						['id', '=', eventId]
					])
				)
				
		);
		if (!event) {
			throw error(401, 'Unauthorized');
		}

		// Create admin notification
		await createNewAdminNotificationQueueObject(triplitHttpClient, user.id, eventId, [userId]);

		return json({ success: true });
	} catch (error) {
		console.error('Failed to create admin notification:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
