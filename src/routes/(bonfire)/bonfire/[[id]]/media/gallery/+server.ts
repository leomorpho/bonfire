import { tempAttendeeSecretParam } from '$lib/enums';
import { fetchAccessibleEventFiles } from '$lib/server/filestorage';
import { triplitHttpClient } from '$lib/server/triplit';
import { error, json } from '@sveltejs/kit';
import { and } from '@triplit/client';

export const GET = async ({ url, params, locals }) => {
	// Extract eventId from URL params
	const { id } = params;

	if (!id) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	let existingAttendee;

	// Only temp users and logged in users can query this endpoint
	let tempAttendeeExists: boolean = false;
	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecret) {
		try {
			 existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.Where([
						and([
							['secret_mapping.id', '=', tempAttendeeSecret],
							['event_id', '=', id]
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

	if ((!user || !user.id) && !tempAttendeeExists) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}

	const bonfireId = params.id;

	try {
		// NOTE: below function checks user is attending bonfire
		const { files, isOwner } = await fetchAccessibleEventFiles(
			bonfireId as string,
			user?.id,
			existingAttendee?.id,
			false
		);
		return json({ files, isOwner });
	} catch (error) {
		console.error('Error fetching event files:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
