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
	const eventCreatedByUserQuery = serverTriplitClient
		.query('events')
		.where('created_by_user_id', '=', user.id)
		.subquery(
			'self_attendance',
			serverTriplitClient.query('attendees').where('user_id', '=', user.id).build()
		)
		.include('attendees')
		.build();

	const eventsCreatedByUser = await serverTriplitClient.fetch(eventCreatedByUserQuery);

	// Process each event and conditionally insert attendance
	await Promise.all(
		eventsCreatedByUser.map(async (event) => {
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

	const attendancesQuery = serverTriplitClient
		.query('attendees')
		.where(['user_id', '=', user.id])
		.include('event', (rel) =>
			rel('event').include('created_by_user').include('event_private').build()
		)
		.order('event.start_time', 'ASC')
		.build();

	const attendances = await serverTriplitClient.fetch(attendancesQuery);
	console.log('attendances', attendances);

	const aQuery = serverTriplitClient
		.query('events')
		.include('event_private')
		.include('created_by_user')
		.build();

	const a = await serverTriplitClient.fetch(aQuery);
	console.log('events', a);

	const privateDetailsQuery = serverTriplitClient
		.query('event_private')
		.build();

	const privateDetails = await serverTriplitClient.fetch(privateDetailsQuery);
	console.log('privateDetails', privateDetails);

	// Divide into past and future events
	const now = new Date();
	const futureEvents = attendances.filter(
		(attendance) => attendance.event && new Date(attendance.event.start_time) > now
	);
	const pastEvents = attendances.filter(
		(attendance) => attendance.event && new Date(attendance.event.start_time) <= now
	);

	return {
		user: user,
		futureEvents,
		pastEvents
	};
};
