import { error, json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/filestorage';
import { tempAttendeeSecretParam } from '$lib/enums';

export const GET = async ({ locals, url }) => {
	// Only temp users and logged in users can query this endpoint
	let tempAttendeeExists: boolean = false;
	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);
	if (tempAttendeeSecret) {
		try {
			const existingTempAttendee = await triplitHttpClient.fetchOne(
				triplitHttpClient
					.query('temporary_attendees')
					.where(['secret_mapping.id', '=', tempAttendeeSecret])
					.build()
			);
			if (existingTempAttendee) {
				tempAttendeeExists = true;
			}
		} catch (e) {
			console.debug('failed to find temp attendee because it does not exist', e);
		}
	}

	const user = locals.user;
	if ((!user || !user.id) && !tempAttendeeExists) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}

	// Extract and parse userIds from query params (comma-separated string)
	const userIdsParam = url.searchParams.get('userIds'); // Expect a single string
	const userIds = userIdsParam?.split(',').map((id) => id.trim()) || []; // Convert to an array

	if (!userIds || userIds.length === 0) {
		return json({ error: 'No user IDs provided' }, { status: 400 });
	}

	try {
		// Fetch profile images for the given user IDs
		const profileImageQuery = triplitHttpClient
			.query('profile_images')
			.where('user_id', 'in', userIds)
			.build();

		const profileImages = await triplitHttpClient.fetch(profileImageQuery);

		// Generate signed URLs and construct the map
		const profileImageMap: any = {};
		for (const image of profileImages) {
			const fullImageUrl = await generateSignedUrl(image.full_image_key);
			const smallImageUrl = await generateSignedUrl(image.small_image_key);
			profileImageMap[image.user_id] = {
				filekey: image.small_image_key,
				full_image_url: fullImageUrl,
				small_image_url: smallImageUrl
			};
		}
		console.log('profileImageMap ===>', profileImageMap);
		return json(profileImageMap);
	} catch (error) {
		console.error('Error fetching profile images:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
