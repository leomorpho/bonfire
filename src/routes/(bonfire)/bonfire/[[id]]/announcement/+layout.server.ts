import { tempAttendeeSecretParam } from '$lib/enums';
import { triplitHttpClient } from '$lib/server/triplit';
import { redirect } from '@sveltejs/kit';
import { and } from '@triplit/client';

// Step 2: Implement the form load function
export const load = async ({ locals, url, params }) => {
	const bonfireId = params.id; // Get the event ID from the route parameters

	if (!bonfireId) {
		redirect(302, '/dashboard');
	}

	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	let tempAttendeeExists: boolean = false;
	if (tempAttendeeSecret) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('temporary_attendees').Where([
					and([
						['secret_mapping.id', '=', tempAttendeeSecret],
						['event_id', '=', bonfireId]
					])
				])
			);
			if (existingAttendee) {
				tempAttendeeExists = true;
			}
		} catch (e) {
			console.debug('failed to find temp attendee because it does not exist', e);
		}
	}

	const user = locals.user;

	if (!user && !tempAttendeeExists) {
		redirect(302, `/bonfire/${bonfireId}`);
	}
};
