import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { fetchAccessibleEventFiles, generateSignedUrl } from '$lib/filestorage';
import { MAX_NUM_IMAGES_IN_MINI_GALLERY, tempAttendeeSecretParam } from '$lib/enums';
import { and } from '@triplit/client';

export const GET = async ({ locals, url, params }) => {
	// Extract eventId from URL params
	const { id } = params;

	if (!id) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	// Only temp users and logged in users can query this endpoint
	let tempAttendeeExists: boolean = false;
	let existingAttendee;

	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecret) {
		try {
			existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.Where(
						and([
							['secret_mapping.id', '=', tempAttendeeSecret],
							['event_id', '=', id]
						])
					)
					
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
		return json({});
	}

	try {
		// NOTE: below function checks user is attending bonfire
		const { files, isOwner } = await fetchAccessibleEventFiles(
			id as string,
			user?.id,
			existingAttendee?.id,
			true,
			MAX_NUM_IMAGES_IN_MINI_GALLERY
		);

		if (!files) {
			return json({});
		}
		// Format and return the files with signed URLs
		const signedFiles = await Promise.all(
			files.map(async (file) => ({
				...file,
				signed_url: await generateSignedUrl(file.file_key),
				linked_file: file.linked_file
					? {
							...file.linked_file,
							signed_url: await generateSignedUrl(file.linked_file.file_key)
						}
					: null
			}))
		);
		return json(signedFiles);
	} catch (error) {
		console.error('Error fetching event files:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
	// try {
	// 	// Fetch files for the given event ID
	// 	const eventFilesQuery = triplitHttpClient
	// 		.query('files')
	// 		.Where('event_id', '=', id)
	// 		.Order('uploaded_at', 'DESC')
	// 		.limit(MAX_NUM_IMAGES_IN_MINI_GALLERY)
	// 		;

	// 	const eventFiles = await triplitHttpClient.fetch(eventFilesQuery);

	// 	// Generate signed URLs for the files
	// 	const signedFiles = await Promise.all(
	// 		eventFiles.map(async (file) => ({
	// 			...file,
	// 			signed_url: await generateSignedUrl(file.file_key)
	// 		}))
	// 	);

	// 	return json(signedFiles);
	// } catch (error) {
	// 	console.error('Error fetching event files:', error);
	// 	return json({ error: 'Internal server error' }, { status: 500 });
	// }
};
