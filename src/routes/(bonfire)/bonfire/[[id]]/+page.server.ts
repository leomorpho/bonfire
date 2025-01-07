import { goto } from '$app/navigation';
import { Status } from '$lib/enums';
import { generateSignedUrl } from '$lib/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = event.locals.user;

	return {
		user: user
	};
};
