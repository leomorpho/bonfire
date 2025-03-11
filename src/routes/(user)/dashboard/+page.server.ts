import { Status } from '$lib/enums.js';
import { triplitHttpClient } from '$lib/server/triplit.js';
import { createAttendeeId } from '$lib/utils';
import { redirect } from '@sveltejs/kit';

// Step 2: Implement the form load function
export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Select all events created by the current user where they don't have an attendance object,
	// and make sure to create one attendance for each of such events. This is a catch-all to make
	// sure they show up on the dashboard since we list by attendance object.
	const eventQuery = triplitHttpClient
		.query('events')
		.Where('user_id', '=', user.id)
		.SubqueryOne(
			'self_attendance',
			triplitHttpClient.query('attendees').Where('user_id', '=', user.id)
		)
		.Include('attendees');
	const events = await triplitHttpClient.fetch(eventQuery);

	// Process each event and conditionally insert attendance
	await Promise.all(
		events.map(async (event) => {
			// Check if self_attendance exists
			if (!event.self_attendance || event.self_attendance.length === 0) {
				await triplitHttpClient.insert('attendees', {
					id: createAttendeeId(event.id, user?.id),
					event_id: event.id,
					user_id: user?.id,
					status: Status.GOING
				});
			}
		})
	);

	return {
		user: user
	};
};
