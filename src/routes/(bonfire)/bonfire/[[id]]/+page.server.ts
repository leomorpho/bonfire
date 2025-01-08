import { goto } from '$app/navigation';
import { triplitHttpClient } from '$lib/server/triplit';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (e) => {
	const eventId = e.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = e.locals.user;
	console.log('logged in user', user);
	let event = null;
	let numAttendees = null;
	let numAnnouncements = null;
	let numFiles = null;

	if (user) {
		try {
			// Add viewer object so user is in the event viewer list else
			// they won't be able to query for that event in FE
			await triplitHttpClient.insert('event_viewers', {
				id: `${eventId}-${user.id}`,
				event_id: eventId,
				user_id: user.id
			});
		} catch (e) {
			console.log(e);
		}
	} else {
		// TODO: flatten into single query
		try {
			event = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('events')
					.where(['id', '=', eventId as string])
					.build()
			);
		} catch (e) {
			console.debug(`failed to fetch event with id ${eventId}`, e);
		}
		try {
			const attendees = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('attendees')
					.where([['event_id', '=', eventId as string]])
					.build()
			);
			numAttendees = attendees.length;
		} catch (e) {
			console.debug(`failed to fetch attendees for event with id ${eventId}`, e);
		}
		try {
			const announcements = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('announcement')
					.where(['event_id', '=', eventId as string])
					.order('created_at', 'DESC')
					.build()
			);
			numAnnouncements = announcements.length;
		} catch (e) {
			console.debug(`failed to fetch announcements for event with id ${eventId}`, e);
		}
		try {
			const files = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('files')
					.where('event_id', '=', eventId as string)
					.build()
			);
			numFiles = files.length;
		} catch (e) {
			console.debug(`failed to fetch files for event with id ${eventId}`, e);
		}
	}
	return {
		user: user,
		event: event,
		numAttendees: numAttendees,
		numAnnouncements: numAnnouncements,
		numFiles: numFiles
	};
};
