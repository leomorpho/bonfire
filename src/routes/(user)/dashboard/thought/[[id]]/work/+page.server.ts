import { redirect, fail } from '@sveltejs/kit';
import {
	getBeliefInThought,
	getBeliefTargetRating,
	getThoughtById,
	setBeliefInThought
} from '$lib/server/database/thought.model';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Access the ID parameter from the route
	const thoughtId = Number(event.params.id); // Ensure it's a number

	// Fetch the associated thought from the database
	const thought = await getThoughtById(thoughtId, user.id); // This function should retrieve the thought object by ID
	if (!thought) {
		throw redirect(404, '/not-found'); // Handle not found case
	}

	const beliefInThought = await getBeliefInThought(thoughtId, user.id);
	const targetBeliefInThought = await getBeliefTargetRating(thoughtId, user.id);

	return {
		thought,
		beliefInThought,
		targetBeliefInThought
	};
};
