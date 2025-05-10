import { isOwnerOrAdmin } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		redirect(302, '/login');
	}

	// Get the user from locals
	const user = event.locals.user;

	if (!user) {
		throw redirect(302, `/bonfire/${eventId}`);
	} else {
		if (!isOwnerOrAdmin(user.id, eventId)) {
			throw redirect(302, `/bonfire/${eventId}`);
		}
	}
};
