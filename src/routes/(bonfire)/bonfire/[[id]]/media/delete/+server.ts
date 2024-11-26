import { error } from '@sveltejs/kit';
import { serverTriplitClient } from '$lib/server/triplit';
import { deleteFilesFromS3 } from '$lib/filestorage';

export const DELETE = async ({ request, locals, params }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { id: eventId } = params;

	if (!eventId) {
		throw error(400, 'Missing event ID');
	}

	// Parse the request body for file IDs
	const body = await request.json();
	const fileIds = body.fileIds;

	if (!fileIds || fileIds.length === 0) {
		throw error(400, 'No file IDs provided');
	}

	// Fetch the event details
	const eventQuery = serverTriplitClient
		.query('events')
		.where(['id', '=', eventId])
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
		.where(['id', 'in', fileIds])
		.select(['id', 'uploader_id', 'file_key']) // Include the S3 file key
		.build();
	const files = await serverTriplitClient.fetch(filesQuery);

	const filesToDelete = files.filter((file) => isOwner || file.uploader_id === user.id);

	// Extract the S3 keys for the files to be deleted
	const s3KeysToDelete = filesToDelete.map((file) => file.file_key);

	// Perform S3 deletion
	const s3DeleteResult = await deleteFilesFromS3(s3KeysToDelete);

	// Delete only files the user is allowed to delete from the database
	for (const file of filesToDelete) {
		await serverTriplitClient.delete('files', file.id);
	}

	return new Response(
		JSON.stringify({
			success: true,
			deletedCount: filesToDelete.length,
			s3Deleted: s3DeleteResult.deleted.length,
			s3Failed: s3DeleteResult.failed
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		}
	);
};
