import { goto } from '$app/navigation';
import { AttendanceStatus } from '$lib/enums';
import { generateSignedUrl } from '$lib/filestorage.js';
import { getUserProfilesForEvent, serverTriplitClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters
	let profileImages = [];
	let eventFiles = [];
	let userProfileMap = new Map();

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = event.locals.user;
	if (user) {
		// Below we create an attendance object for anyone visiting the bonfire if they don't yet have an attendance object.
		// This allows them to keep track from their dashboard of events they've been invited to (and seen).
		const currentUserAttendanceQuery = serverTriplitClient
			.query('attendees')
			.where([
				and([
					['user_id', '=', user.id],
					['event_id', '=', eventId as string]
				])
			])
			.build();

		const result = await serverTriplitClient.fetch(currentUserAttendanceQuery);

		// Create an attendance record if it does not exist
		if (result.length === 0) {
			await serverTriplitClient.insert('attendees', {
				user_id: user.id,
				event_id: eventId as string,
				status: AttendanceStatus.DEFAULT // Default status
			});
		}

		userProfileMap = await getUserProfilesForEvent(eventId as string);
		
		console.log('userProfileMap', userProfileMap);
		const eventFilesQuery = serverTriplitClient
			.query('files')
			.where(['event_id', '=', eventId as string])
			.limit(3)
			.build();

		eventFiles = await serverTriplitClient.fetch(eventFilesQuery);

		for (const eventFile of eventFiles) {
			const fileURL = await generateSignedUrl(eventFile.file_key);
			// @ts-ignore
			eventFile.URL = fileURL;
		}
	}

	return {
		userProfileMap: userProfileMap,
		user: user,
		eventFiles: eventFiles
	};
};
