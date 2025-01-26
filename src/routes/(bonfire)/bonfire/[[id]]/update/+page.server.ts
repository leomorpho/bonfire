import { triplitHttpClient } from '$lib/server/triplit.js';
import { redirect } from '@sveltejs/kit';
import { and } from '@triplit/client';

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
		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('events')
				.where([
					and([
						['user_id', '=', user.id],
						['id', '=', eventId]
					])
				])
				.build()
		);

		if (event) {
			return;
		}

		const admin = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('event_admins')
				.where([
					and([
						['user_id', '=', user.id],
						['event_id', '=', eventId]
					])
				])
				.build()
		);
		console.log('----====> admin', admin);
		if (!admin) {
			throw redirect(302, `/bonfire/${eventId}`);
		}
	}
};
