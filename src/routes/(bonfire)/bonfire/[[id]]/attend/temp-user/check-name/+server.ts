import { json, error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

export async function POST({ request, params }) {
	try {
		const { id: eventId } = params;

		if (!eventId) {
			throw error(400, 'Missing event ID');
		}

		// Extract event ID and name from the request body
		const { name }: { name: string } = await request.json();

		// Validate input
		if (!name) {
			throw error(400, 'Missing name');
		}

		// Check if an attendee with the same name already exists for this event
		const existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('temporary_attendees').Where(
				and([
					['event_id', '=', eventId],
					['name', '=', name]
				])
			)
		);

		// Respond based on the result
		if (existingAttendee) {
			return json({ success: false, message: 'Name is already taken' }, { status: 409 });
		}

		return json({ success: true, message: 'Name is available' });
	} catch (err) {
		console.error('Error checking name availability:', err);
		throw error(500, 'Failed to check name availability');
	}
}
