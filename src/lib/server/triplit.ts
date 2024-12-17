import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { generateSignedUrl } from '$lib/filestorage';

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getUserProfilesForEvent(eventId: string, timestampParam?: string | null) {
	try {
		// Fetch attendees for the given event ID
		const attendeesQuery = serverTriplitClient
			.query('attendees')
			.where([['event_id', '=', eventId]])
			.include('user')
			.include('user', (rel) => rel('user').include('profile_image').build())
			.build();

		const attendeesResult = await serverTriplitClient.fetch(attendeesQuery);

		console.log('attendeesResult', attendeesResult);

		// Create a Set of user IDs from the attendees
		const userIdList = attendeesResult.map((attendee) => attendee.user_id);

		// Query to fetch usernames for the specific user IDs
		const usersQuery = serverTriplitClient
			.query('user')
			// .where('id', 'in', userIdList)
			.select(['id', 'username'])
			.build();
		const usersResult = await serverTriplitClient.fetch(usersQuery);

		// Map user IDs to usernames
		const userMap = new Map();
		for (const user of usersResult) {
			userMap.set(user.id, { username: user.username });
		}

		// Build the profile image query with optional timestamp filter
		const profileImageQueryBuilder = serverTriplitClient
			.query('profile_images')
			.where('user_id', 'in', userIdList);

		// Apply timestamp filter if provided
		if (timestampParam) {
			const timestamp = new Date(timestampParam);
			profileImageQueryBuilder.where(['uploaded_at', '>', timestamp]);
		}

		const profileImagesQuery = profileImageQueryBuilder.build();

		// Fetch profile images
		const profileImages = await serverTriplitClient.fetch(profileImagesQuery);

		// Create a map to combine profile images with usernames
		const userProfileMap = new Map();
		for (const image of profileImages) {
			// Generate signed URLs for both the full and small image keys
			const fullImageUrl = await generateSignedUrl(image.full_image_key);
			const smallImageUrl = await generateSignedUrl(image.small_image_key);

			// Get username from the map
			const userProfile = userMap.get(image.user_id) || { username: 'Unknown' }; // Fallback if no username is found

			// Store the combined profile data
			userProfileMap.set(image.user_id, {
				username: userProfile.username,
				full_image_url: fullImageUrl,
				small_image_url: smallImageUrl,
				uploaded_at: image.uploaded_at
			});
		}

		return userProfileMap;
	} catch (error) {
		console.error('Error fetching user profiles:', error);
		throw new Error('Failed to fetch user profiles');
	}
}
