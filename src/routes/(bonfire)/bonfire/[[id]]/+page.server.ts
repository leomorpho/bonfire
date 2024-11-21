import { goto } from '$app/navigation';
import { DEFAULT } from '$lib/enums';
import { generateSignedUrl } from '$lib/images.js';
import { serverTriplitClient } from '$lib/triplit';
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
				status: DEFAULT // Default status
			});
		}
	}

	// Get profile pics of all attendees
	const attendeesQuery = serverTriplitClient
		.query('attendees')
		.where([['event_id', '=', eventId as string]])
		.select(['user_id', 'status'])
		.build();

	const attendeesResult = await serverTriplitClient.fetch(attendeesQuery);

	// // Generate a Map of user IDs to image URLs
	// const profileAttendanceMap = new Map();

	// for (const attendance of attendeesResult) {
	// 	// Add to the Map
	// 	profileAttendanceMap.set(attendance.user_id, {
	// 		status: attendance.status
	// 	});
	// }

	// Create a Set of user IDs
	const userIdList = attendeesResult.map((attendee) => attendee.user_id);

	const profileImageQuery = serverTriplitClient
		.query('profile_images')
		.where('user_id', 'in', userIdList)
		.build();

	const profileImages = await serverTriplitClient.fetch(profileImageQuery);
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

	return {
		profileImageMap: profileImageMap,
		user: user
	};
};
