// src/routes/a/[id]/update/+server.js

import { isOwnerOrAdmin } from '$lib/auth';
import { triplitHttpClient } from '$lib/server/triplit.js';
import { redirect } from '@sveltejs/kit';
import { updateRemindersObjects } from '$lib/triplit';

export const GET = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		throw redirect(302, '/dashboard');
	}

	// Get the user from locals
	const user = event.locals.user;

	if (!user) {
		throw redirect(302, `/bonfire/${eventId}`);
	} else {
		if (!isOwnerOrAdmin(user.id, eventId)) {
			throw redirect(302, `/bonfire/${eventId}`);
		}
	}

	try {
		// Trigger the updateRemindersObjects function
		await updateRemindersObjects(triplitHttpClient, eventId);

		// Return a success response
		return new Response(
			JSON.stringify({ success: true, message: 'Reminders updated successfully' }),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error('Error updating reminders:', error);

		// Return an error response
		return new Response(JSON.stringify({ success: false, message: 'Failed to update reminders' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
