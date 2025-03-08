import { error, json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit'; // Assuming you have Triplit client configured
import { Status, tempAttendeeSecretParam } from '$lib/enums';
import { dev } from '$app/environment';
import { and } from '@triplit/client';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';
// import { RateLimiter } from 'sveltekit-rate-limiter/server';

// // Initialize the rate limiter
// const limiter = new RateLimiter({
// 	IP: [30, 'h'], // Limit 30 requests per hour per IP
// 	IPUA: [20, 'h'] // Limit 20 requests per hour per IP + User Agent
// });

export async function POST({ request, params }) {
	// Check if the request is limited
	// if (!dev && (await limiter.isLimited({ request }))) {
	// 	throw error(429, 'Too many requests. Please try again later.');
	// }

	const { id: eventId } = params;

	if (!eventId) {
		throw error(400, 'Missing event ID');
	}
	try {
		// Extract attendee data from the request body
		const {
			id,
			status,
			name,
			numExtraGuests
		}: { id?: string; event_id: string; status?: string; name: string; numExtraGuests: number } =
			await request.json();

		if (!id) {
			throw error(400, 'Missing temporary attendance ID');
		}
		if (!name) {
			throw error(400, 'Name is required');
		}
		if (!status) {
			throw error(400, 'Satus is required');
		}

		if (dev) {
			console.log('temp id', id);
			console.log('event_id', eventId);
			console.log('status', status);
			console.log('name', name);
		}

		await checkEventIsOpenForNewGoingAttendees(triplitHttpClient, eventId, Status.GOING);

		// Check if an attendee with the same name already exists for this event
		const existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees')
				.where(
					and([
						['event_id', '=', eventId],
						['name', '=', name]
					])
				)
				.build()
		);
		if (existingAttendee) {
			return json(
				{ success: false, message: 'A temporary attendee with this name already exists.' },
				{ status: 409 } // Conflict HTTP status code
			);
		}

		// Use Triplit to insert the temporary attendee record
		const { output } = await triplitHttpClient.insert('temporary_attendees', {
			event_id: eventId,
			status: status || 'undecided', // Default status if not provided
			name,
			guest_count: numExtraGuests
		});

		await triplitHttpClient.insert('temporary_attendees_secret_mapping', {
			id: id,
			temporary_attendee_id: output.id
		});

		// Return the URL the FE can redirect to
		const redirectUrl = `/bonfire/${eventId}?${tempAttendeeSecretParam}=${id}`;
		return json({ success: true, redirectUrl });
	} catch (err) {
		console.error('Error creating temporary attendee:', err);
		return error(500, 'Failed to create temporary attendee');
	}
}
