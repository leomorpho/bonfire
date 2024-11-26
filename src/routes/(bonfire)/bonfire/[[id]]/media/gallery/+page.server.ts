import { goto } from '$app/navigation';
import { generateSignedUrl } from '$lib/filestorage.js';
import { serverTriplitClient } from '$lib/server/triplit';
import { error } from '@sveltejs/kit';

// Step 2: Implement the form load function
export const load = async (e) => {
	const eventId = e.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	const user = e.locals.user;

	if (!user) {
		goto('/login');
	}

	// NOTE: if we want to support multiple admins in the future this is where the query must be updated.
	const eventQuery = serverTriplitClient
		.query('events')
		.where(['id', '=', eventId as string])
		.select(['user_id'])
		.build();
	const event = await serverTriplitClient.fetch(eventQuery);

	let isOwner = false;
	if (event.user_id == user?.id) {
		isOwner = true;
	}

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
		eventFiles: eventFiles,
		isOwner: isOwner
	};
};

export const actions = {
	deleteFile: async ({ request, locals, params }) => {
		const user = locals.user;
		if (!user) {
			throw error(401, 'Unauthorized');
		}

		const formData = await request.formData();
		const fileIds = formData.getAll('fileIds');

		if (!fileIds || fileIds.length === 0) {
			throw error(400, 'No file IDs provided');
		}

		// Fetch the event details
		const eventQuery = serverTriplitClient
			.query('events')
			.where(['id', '=', params.id as string])
			.select(['user_id'])
			.build();
		const event = await serverTriplitClient.fetch(eventQuery);

		if (!event) {
			throw error(404, 'Event not found');
		}

		// Check if the user is the event owner
		const isOwner = event.user_id === user.id;

		// Fetch the file details and filter based on permissions
		const filesQuery = serverTriplitClient
			.query('files')
			.where(['id', 'in', fileIds as string[]])
			.select(['id', 'uploader_id'])
			.build();
		const files = await serverTriplitClient.fetch(filesQuery);

		const filesToDelete = files.filter(
			(file) => isOwner || file.uploader_id === user.id
		);

		// Delete only files the user is allowed to delete
		for (const file of filesToDelete) {
			await serverTriplitClient.delete('files', file.id);
		}

		return {
			success: true,
			deletedCount: filesToDelete.length
		};
	}
};