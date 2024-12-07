import { AttendanceStatus } from '$lib/enums.js';
import { serverTriplitClient } from '$lib/server/triplit.js';
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
	const eventQuery = serverTriplitClient
		.query('events')
		.where('user_id', '=', user.id)
		.subquery(
			'self_attendance',
			serverTriplitClient.query('attendees').where('user_id', '=', user.id).build()
		)
		.include('attendees')
		.build();

	const events = await serverTriplitClient.fetch(eventQuery);

	// Process each event and conditionally insert attendance
	await Promise.all(
		events.map(async (event) => {
			// Check if self_attendance exists
			if (!event.self_attendance || event.self_attendance.length === 0) {
				await serverTriplitClient.insert('attendees', {
					event_id: event.id,
					user_id: user?.id,
					status: AttendanceStatus.GOING
				});
			}
		})
	);

	return {
		user: user
	};
};
