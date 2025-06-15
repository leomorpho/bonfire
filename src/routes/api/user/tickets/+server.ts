import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

// GET - Get user's tickets for a specific event
export async function GET({ url, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const eventId = url.searchParams.get('eventId');
	if (!eventId) {
		return json({ error: 'eventId is required' }, { status: 400 });
	}

	try {
		const tickets = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('tickets')
				.Where([['user_id', '=', user.id]])
				.Where([['ticket_type.event_id', '=', eventId]])
				.Where([['status', '=', 'active']])
				.Include('ticket_type')
				.Order('purchased_at', 'DESC')
		);

		return json({ tickets });
	} catch (error) {
		console.error('Error fetching user tickets:', error);
		return json({ error: 'Failed to fetch tickets' }, { status: 500 });
	}
}
