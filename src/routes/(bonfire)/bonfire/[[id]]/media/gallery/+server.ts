import { tempAttendeeSecretParam } from '$lib/enums';
import { fetchAccessibleEventFiles } from '$lib/filestorage';
import { triplitHttpClient } from '$lib/server/triplit';
import { error, json } from '@sveltejs/kit';
import { and } from '@triplit/client';

export const GET = async ({ url, params, locals }) => {
	// Extract eventId from URL params
	const { id } = params;

	if (!id) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	// Only temp users and logged in users can query this endpoint
	let tempAttendeeExists: boolean = false;
	const tempAttendeeId = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeId) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.where([
						and([
							['id', '=', tempAttendeeId],
							['event_id', '=', id]
						])
					])
					.build()
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
		const { files, isOwner } = await fetchAccessibleEventFiles(bonfireId as string, user?.id, null, false);
		return json({ files, isOwner });
	} catch (err) {
		return json({ error: err.message }, { status: 400 });
	}
};
