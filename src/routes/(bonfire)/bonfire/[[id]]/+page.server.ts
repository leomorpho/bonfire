import { goto } from '$app/navigation';
import { triplitHttpClient } from '$lib/server/triplit';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = event.locals.user;

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
	}

	return {
		user: user
	};
};
