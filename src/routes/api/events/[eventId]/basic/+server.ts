import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

// GET - Get basic event info for RSVP checks
export async function GET({ params, locals }: RequestEvent): Promise<Response> {
	const { eventId } = params;

	if (!eventId) {
		return json({ error: 'Event ID is required' }, { status: 400 });
	}

	try {
		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.Where([['id', '=', eventId]])
				.Select(['id', 'title', 'is_ticketed', 'max_tickets_per_user', 'ticket_currency'])
		);

		if (!event) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		return json(event);
	} catch (error) {
		console.error('Error fetching event basic info:', error);
		return json({ error: 'Failed to fetch event info' }, { status: 500 });
	}
}
