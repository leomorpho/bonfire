import { error, json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/filestorage';
import { MAX_NUM_IMAGES_IN_MINI_GALLERY, tempAttendeeIdUrlParam } from '$lib/enums';

export const GET = async ({ locals, url, params }) => {
	// Extract eventId from URL params
	const { id } = params;

	if (!id) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	// Only temp users and logged in users can query this endpoint
	let tempAttendeeExists: boolean = false;
	const tempAttendeeId = url.searchParams.get(tempAttendeeIdUrlParam);
	if (tempAttendeeId) {
		try {
			const existingAttendee = await triplitHttpClient.fetchById(
				'temporary_attendees',
				tempAttendeeId
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

	try {
		// Fetch files for the given event ID
		const eventFilesQuery = triplitHttpClient
			.query('files')
			.where('event_id', '=', id)
			.order('uploaded_at', 'DESC')
			.limit(MAX_NUM_IMAGES_IN_MINI_GALLERY)
			.build();

		const eventFiles = await triplitHttpClient.fetch(eventFilesQuery);

		// Generate signed URLs for the files
		const signedFiles = await Promise.all(
			eventFiles.map(async (file) => ({
				...file,
				signed_url: await generateSignedUrl(file.file_key)
			}))
		);

		return json(signedFiles);
	} catch (error) {
		console.error('Error fetching event files:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
