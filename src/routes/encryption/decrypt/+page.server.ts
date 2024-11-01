import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect if the user is not authenticated
	}

	// Fetch salt from user data in the database
	const salt = user.salt; // Assuming salt is stored with the user

	return {
		salt,
	};
};
