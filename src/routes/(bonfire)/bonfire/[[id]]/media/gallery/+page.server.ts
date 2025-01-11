import { tempAttendeeIdUrlParam } from '$lib/enums';
import { fetchAccessibleEventFiles } from '$lib/filestorage';
import { triplitHttpClient } from '$lib/server/triplit';
import { error, redirect } from '@sveltejs/kit';
import { and } from '@triplit/client';

// Step 2: Implement the form load function
export const load = async ({ locals, url, params }) => {
	const bonfireId = params.id; // Get the event ID from the route parameters

	if (!bonfireId) {
		redirect(302, '/dashboard');
	}

	const tempAttendeeId = url.searchParams.get(tempAttendeeIdUrlParam);

	let tempAttendeeExists: boolean = false;
	if (tempAttendeeId) {
		try {
			const existingAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.where([
						and([
							['id', '=', tempAttendeeId],
							['event_id', '=', bonfireId]
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

	if (!user && !tempAttendeeExists) {
		redirect(302, '/login');
	}

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
		const eventQuery = triplitHttpClient
			.query('events')
			.where(['id', '=', params.id as string])
			// .select(['user_id']) // TODO: select bug in http client
			.build();
		const event = await triplitHttpClient.fetch(eventQuery);

		if (!event) {
			throw error(404, 'Event not found');
		}

		// Check if the user is the event owner
		const isOwner = event.user_id === user.id;

		// Fetch the file details and filter based on permissions
		const filesQuery = triplitHttpClient
			.query('files')
			.where(['id', 'in', fileIds as string[]])
			// .select(['id', 'uploader_id']) // TODO: select bug in http client
			.build();
		const files = await triplitHttpClient.fetch(filesQuery);

		const filesToDelete = files.filter((file) => isOwner || file.uploader_id === user.id);

		// Delete only files the user is allowed to delete
		for (const file of filesToDelete) {
			await triplitHttpClient.delete('files', file.id);
		}

		return {
			success: true,
			deletedCount: filesToDelete.length
		};
	}
};
