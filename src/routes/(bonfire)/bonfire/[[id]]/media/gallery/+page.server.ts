import { goto } from '$app/navigation';
import { generateSignedUrl } from '$lib/filestorage.js';
import { serverTriplitClient } from '$lib/server/triplit';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	const user = event.locals.user;

	const eventFilesQuery = serverTriplitClient
		.query('files')
		.where(['event_id', '=', eventId as string])
		.build();

	const eventFiles = await serverTriplitClient.fetch(eventFilesQuery);

	for (const eventFile of eventFiles) {
		const fileURL = await generateSignedUrl(eventFile.file_key);
		// @ts-ignore
		eventFile.URL = fileURL;
	}

	return {
		user: user,
		eventFiles: eventFiles
	};
};
