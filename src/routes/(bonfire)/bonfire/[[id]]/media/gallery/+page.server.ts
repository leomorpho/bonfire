import { fetchAccessibleEventFiles } from '$lib/server/filestorage';
import { redirect } from '@sveltejs/kit';

// Step 2: Implement the form load function
export const load = async ({ locals, params }) => {
	const bonfireId = params.id; // Get the event ID from the route parameters

	if (!bonfireId) {
		redirect(302, '/dashboard');
	}

	// Access is controlled in `/media/+layout.server.ts`

	const user = locals.user;

	try {
		const { files, isOwner } = await fetchAccessibleEventFiles(
			bonfireId as string,
			user?.id,
			null,
			false
		);
		return {
			user: user,
			eventFiles: files,
			isOwner: isOwner
		};
	} catch (error) {
		console.error(error.message);
		return {
			user: user,
			eventFiles: [],
			isOwner: false
		};
	}
};

// NOTE: pretty sure below code is DEAD
// export const actions = {
// 	deleteFile: async ({ request, locals, params }) => {
// 		const user = locals.user;
// 		if (!user) {
// 			throw error(401, 'Unauthorized');
// 		}

// 		const formData = await request.formData();
// 		const fileIds = formData.getAll('fileIds');

// 		if (!fileIds || fileIds.length === 0) {
// 			throw error(400, 'No file IDs provided');
// 		}

// 		// Fetch the event details
// 		const eventQuery = triplitHttpClient
// 			.query('events')
// 			.Where(['id', '=', params.id as string])
// 			// .Select(['user_id']) // TODO: select bug in http client
// 			;
// 		const event = await triplitHttpClient.fetch(eventQuery);

// 		if (!event) {
// 			throw error(404, 'Event not found');
// 		}

// 		// Check if the user is the event owner
// 		const isOwner = event.user_id === user.id;

// 		// Fetch the file details and filter based on permissions
// 		const filesQuery = triplitHttpClient
// 			.query('files')
// 			.Where(['id', 'in', fileIds as string[]])
// 			// .Select(['id', 'uploader_id']) // TODO: select bug in http client
// 			;
// 		const files = await triplitHttpClient.fetch(filesQuery);

// 		const filesToDelete = files.filter((file) => isOwner || file.uploader_id === user.id);

// 		// Delete only files the user is allowed to delete
// 		for (const file of filesToDelete) {
// 			await triplitHttpClient.delete('files', file.id);
// 		}

// 		return {
// 			success: true,
// 			deletedCount: filesToDelete.length
// 		};
// 	}
// };
