import { Status } from '$lib/enums.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { createAttendeeId } from '$lib/utils';
import { error, json } from '@sveltejs/kit';
import { and } from '@triplit/client';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';

export const POST = async ({ request, params, locals }) => {
	// Extract event ID from the URL params
	const bonfireId = params.id;

	if (!bonfireId) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	// Extract user from locals
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}

	// Parse request body
	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { status, numGuests } = requestBody;

	if (!status) {
		return json({ error: 'Missing status' }, { status: 400 });
	}

	await checkEventIsOpenForNewGoingAttendees(triplitHttpClient, bonfireId, status);

	try {
		// Check if attendance record exists
		let attendance = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('attendees')
				.Where([
					and([
						['user_id', '=', user.id],
						['event_id', '=', bonfireId]
					])
				])
				
		);

		// If attendance does not exist, create it
		if (!attendance) {
			attendance = await triplitHttpClient.insert('attendees', {
				id: createAttendeeId(bonfireId, user.id),
				user_id: user.id,
				event_id: bonfireId,
				status,
				guest_count: numGuests
			});
		} else {
			let newNumGuest = attendance.guest_count;
			if (numGuests !== null && Number.isInteger(numGuests)) {
				newNumGuest = numGuests;
			}
			// Update existing attendance record
			attendance = await triplitHttpClient.update('attendees', attendance.id, (entity) => {
				entity.status = status;
				entity.guest_count = newNumGuest;
			});
		}

		return json({ success: true, attendance });
	} catch (err) {
		console.error('Error processing event attendance:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
