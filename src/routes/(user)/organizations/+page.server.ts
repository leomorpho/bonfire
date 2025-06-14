import { triplitHttpClient } from '$lib/server/triplit';
import { getUserOrganizations } from '$lib/organizations';

export const load = async ({ locals }) => {
	if (!locals.user) {
		return {
			userOrganizations: [],
			user: null
		};
	}

	const client = triplitHttpClient;

	try {
		// Get user's organizations
		const userOrganizations = await getUserOrganizations(client, locals.user.id);

		return {
			userOrganizations,
			user: locals.user
		};
	} catch (error) {
		console.error('Error loading organizations:', error);
		return {
			userOrganizations: [],
			user: locals.user
		};
	}
};
