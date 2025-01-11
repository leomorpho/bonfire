import { goto } from '$app/navigation';
import { tempAttendeeIdUrlParam } from '$lib/enums';
import { triplitHttpClient } from '$lib/server/triplit';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async ({ params, locals, url }) => {
	const eventId = params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = locals.user;
	console.log('logged in user', user);
	let event = null;
	let numAttendees = null;
	let numAnnouncements = null;
	let numFiles = null;

	let tempAttendeeExists: boolean = false;
	const tempAttendeeId = url.searchParams.get(tempAttendeeIdUrlParam);
	if (tempAttendeeId) {
		try {
			const existingAttendee = await triplitHttpClient.fetchById(
				'temporary_attendees',
				tempAttendeeId
			);
			if (existingAttendee) {
				tempAttendeeExists = true;
			}
		} catch (e) {
			console.debug('failed to find temp attendee because it does not exist', e);
		}
	}

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
	} else if (!tempAttendeeExists) {
		// TODO: flatten into single query
		try {
			event = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('events')
					.where(['id', '=', eventId as string])
					.include('announcements')
					.include('attendees')
					.include('files')
					.subquery(
						'organizer',
						triplitHttpClient
							.query('user')
							.where(['id', '=', '$1.user_id'])
							.select(['username', 'id'])
							.build(),
						'one'
					)
					.build()
			);
			if (event != null) {
				if (event.attendees != null) {
					numAttendees = event.attendees.length;
				}
				if (event.announcements != null) {
					numAnnouncements = event.announcements.length;
				}
				if (event.files != null) {
					numFiles = event.files.length;
				}

				// console.log("numAttendees", numAttendees)
				// console.log("numAnnouncements", numAnnouncements)
				// console.log("numFiles", numFiles)
			}
		} catch (e) {
			console.debug(`### failed to fetch event with id ${eventId}`, e);
		}
	}
	return {
		user: user,
		event: event,
		numAttendees: numAttendees,
		numAnnouncements: numAnnouncements,
		numFiles: numFiles,
		tempAttendeeExists: tempAttendeeExists
	};
};
