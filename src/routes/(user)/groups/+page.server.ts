import { triplitHttpClient } from '$lib/server/triplit';
import { getUserGroups } from '$lib/groups';

export const load = async ({ locals }) => {
	if (!locals.user) {
		return {
			userGroups: [],
			user: null
		};
	}

	const client = triplitHttpClient;

	try {
		// Get user's groups
		const userGroups = await getUserGroups(client, locals.user.id);

		return {
			userGroups,
			user: locals.user
		};
	} catch (error) {
		console.error('Error loading groups:', error);
		return {
			userGroups: [],
			user: locals.user
		};
	}
};
