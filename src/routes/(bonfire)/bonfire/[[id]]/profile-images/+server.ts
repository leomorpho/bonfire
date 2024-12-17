import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserProfilesForEvent } from '$lib/server/triplit';

export const GET: RequestHandler = async (event) => {
	// Get the event ID and optional timestamp from query parameters
	const eventId = event.url.searchParams.get('eventId');

	// Validate user authentication
	const user = event.locals.user;
	if (!user || !eventId) {
		return json({ error: 'Unauthorized or missing event ID' }, { status: 401 });
	}

	try {
		// Use the reusable method to get user profiles for the given event ID and timestamp
		const userProfileMap = await getUserProfilesForEvent(eventId);

		return json({ userProfileMap: Object.fromEntries(userProfileMap) });
	} catch (error) {
		console.error('Error fetching user profiles:', error);
		return json({ error: 'Failed to fetch user profiles' }, { status: 500 });
	}
};
