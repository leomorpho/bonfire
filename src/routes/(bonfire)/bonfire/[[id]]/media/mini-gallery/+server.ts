import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/filestorage';

export const GET = async ({ params }) => {
	// Extract eventId from URL params
	const { id } = params;

	if (!id) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	try {
		// Fetch files for the given event ID
		const eventFilesQuery = triplitHttpClient
			.query('files')
			.where('event_id', '=', id)
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
