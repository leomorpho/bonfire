import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	if (!user) {
		const eventId = event.params.id; // Get the event ID from the route parameters

		if (!eventId) {
			redirect(302, '/login');
		}
		throw redirect(302, `/bonfire/${eventId}`);
	}
};
