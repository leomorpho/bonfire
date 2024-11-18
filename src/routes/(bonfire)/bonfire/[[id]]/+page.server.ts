import { goto } from '$app/navigation';
import { DEFAULT } from '$lib/enums';
import { serverTriplitClient } from '$lib/triplit';
import { and } from '@triplit/client';

// Step 2: Implement the form load function
export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		return;
	}
	const eventId = event.params.id; // Get the event ID from the route parameters

    if (!eventId) {
		goto('/dashboard');
	}

	const query = serverTriplitClient
		.query('attendees')
		.where([
			and([
				['user_id', '=', user.id],
				['event_id', '=', eventId as string]
			])
		])
		.build();

	const result = await serverTriplitClient.fetch(query);

    // Create an attendance record if it does not exist
	if (result.length === 0) {
		await serverTriplitClient.insert('attendees', {
			user_id: user.id,
			event_id: eventId as string,
			status: DEFAULT // Default status
		});
	}
};
