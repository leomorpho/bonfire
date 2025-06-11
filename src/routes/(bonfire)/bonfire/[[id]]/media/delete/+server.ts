import { error, json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { deleteFilesFromS3 } from '$lib/server/filestorage';
import { tempAttendeeSecretParam } from '$lib/enums';
import { and } from '@triplit/client';

export const DELETE = async ({ request, locals, params, url }) => {
	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	// Extract eventId from URL params
	const { id: eventId } = params;

	if (!eventId) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	let tempAttendeeExists: boolean = false;
	let existingTempAttendee = null;

	try {
		existingTempAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('temporary_attendees').Where([
				and([
					['secret_mapping.id', '=', tempAttendeeSecret],
					['event_id', '=', eventId]
				])
			])
		);
		if (existingTempAttendee) {
			tempAttendeeExists = true;
		}
	} catch (error) {
		console.error(`Error checking for temp attendee with secret ${tempAttendeeSecret}:`, error);
		return new Response('Internal Server Error', { status: 500 });
	}

	try {
		const user = locals.user;

		if (!user && !tempAttendeeExists) {
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
		const eventQuery = triplitHttpClient
			.query('events')
			.Where(['id', '=', eventId])
			.Include('event_admins');
		// .Select(['user_id']) // TODO: select bug in http client
		const event = await triplitHttpClient.fetchOne(eventQuery);

		if (!event) {
			throw error(404, 'Event not found');
		}

		// Check if the user is the event owner
		let isAdmin = false;
		if (user) {
			// Check if user is the event owner
			if (event.user_id === user.id) {
				isAdmin = true;
			}

			// Check if user is in event_admins
			if (event.event_admins?.some((admin) => admin.user_id === user.id)) {
				isAdmin = true;
			}
		}

		// Fetch the file details and filter based on permissions
		let filesQuery;

		if (user && isAdmin) {
			console.log('=> GOD MODE', fileIds);
			filesQuery = triplitHttpClient.query('files').Where([['id', 'in', fileIds]]);
			// .Select(['id', 'uploader_id', 'file_key']) // Include the S3 file key // TODO: select bug in http client
		} else if (user && !isAdmin) {
			filesQuery = triplitHttpClient.query('files').Where(
				and([
					['id', 'in', fileIds],
					['uploader_id', '=', user?.id]
				])
			);
			// .Select(['id', 'uploader_id', 'file_key']) // Include the S3 file key // TODO: select bug in http client
		} else if (tempAttendeeExists) {
			filesQuery = triplitHttpClient.query('files').Where(
				and([
					['id', 'in', fileIds],
					['temp_uploader_id', '=', existingTempAttendee?.id]
				])
			);
			// .Select(['id', 'uploader_id', 'file_key']) // Include the S3 file key // TODO: select bug in http client
		} else {
			return new Response(JSON.stringify({ error: 'Not authorized' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		const files = await triplitHttpClient.fetch(filesQuery);

		if (!files || files.length === 0) {
			return new Response(JSON.stringify({ error: 'No valid files found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const filesToDelete = files
			.filter((file) => file) // Exclude null or undefined files
			.filter(
				(file) =>
					isAdmin ||
					file.temp_uploader_id == existingTempAttendee?.id ||
					file.uploader_id === user?.id
			);

		// Extract the S3 keys for the files to be deleted
		const s3KeysToDelete = filesToDelete.map((file) => file.file_key);

		// Perform S3 deletion
		const s3DeleteResult = await deleteFilesFromS3(s3KeysToDelete);

		// Delete only files the user is allowed to delete from the database
		for (const file of filesToDelete) {
			await triplitHttpClient.delete('files', file.id);
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
	} catch (e) {
		console.error('failed to delete file(s):', e);
	}
};
