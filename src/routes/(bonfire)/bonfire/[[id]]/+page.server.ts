import { goto } from '$app/navigation';
import { Status } from '$lib/enums';
import { generateSignedUrl } from '$lib/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

export const trailingSlash = 'always';

// Step 2: Implement the form load function
export const load = async (event) => {
	const eventId = event.params.id; // Get the event ID from the route parameters

	if (!eventId) {
		goto('/dashboard');
	}

	// Get the user from locals
	const user = event.locals.user;
	if (user) {
		// Below we create an attendance object for anyone visiting the bonfire if they don't yet have an attendance object.
		// This allows them to keep track from their dashboard of events they've been invited to (and seen).
		const currentUserAttendanceQuery = triplitHttpClient
			.query('attendees')
			.where([
				and([
					['user_id', '=', user.id],
					['event_id', '=', eventId as string]
				])
			])
			.build();

		const result = await triplitHttpClient.fetch(currentUserAttendanceQuery);

		// Create an attendance record if it does not exist
		if (result.length === 0) {
			await triplitHttpClient.insert('attendees', {
				user_id: user.id,
				event_id: eventId as string,
				status: Status.DEFAULT // Default status
			});
		}
	}

	// Get profile pics of all attendees
	const attendeesQuery = triplitHttpClient
		.query('attendees')
		.where([['event_id', '=', eventId as string]])
		// .select(['user_id', 'status']) // TODO: select bug in http client
		.build();

	const attendeesResult = await triplitHttpClient.fetch(attendeesQuery);

	// Create a Set of user IDs
	const userIdList = attendeesResult.map((attendee) => attendee.user_id);

	const profileImageQuery = triplitHttpClient
		.query('profile_images')
		.where('user_id', 'in', userIdList)
		.build();

	const profileImages = await triplitHttpClient.fetch(profileImageQuery);
	console.log('profileImages', profileImages);

	// Generate a Map of user IDs to image URLs
	const profileImageMap = new Map();

	for (const image of profileImages) {
		const fullImageUrl = await generateSignedUrl(image.full_image_key);
		const smallImageUrl = await generateSignedUrl(image.small_image_key);

		// Add to the Map
		profileImageMap.set(image.user_id, {
			full_image_url: fullImageUrl,
			small_image_url: smallImageUrl
		});
	}

	const eventFilesQuery = triplitHttpClient
		.query('files')
		.where(['event_id', '=', eventId as string])
		.limit(3)
		.build();

	const eventFiles = await triplitHttpClient.fetch(eventFilesQuery);

	for (const eventFile of eventFiles) {
		const fileURL = await generateSignedUrl(eventFile.file_key);
		// @ts-ignore
		eventFile.URL = fileURL;
	}

	return {
		profileImageMap: profileImageMap,
		user: user,
		eventFiles: eventFiles
	};
};
