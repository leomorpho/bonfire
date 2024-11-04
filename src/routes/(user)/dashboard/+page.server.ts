import { redirect } from '@sveltejs/kit';
import { listThoughts } from '$lib/server/database/thought.model';

// Step 2: Implement the form load function
export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Fetch the user's thoughts from the database
	const thoughts = await listThoughts(user.id);

	return {
		thoughts, // Pass thoughts to the frontend
		userId: user.id
	};
};
