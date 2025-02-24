import { error, json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/filestorage';
import { tempAttendeeSecretParam } from '$lib/enums';

// TODO: move this endpoint to /profile/data as it's not only for profile images anymore
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
		// Fetch all users and include profile images
		const usersQuery = triplitHttpClient
			.query('user')
			.include('profile_image') // Ensure the relation exists
			.build();

		const users = await triplitHttpClient.fetch(usersQuery);

		// Generate signed URLs and construct the map
		const userMap: Record<string, any> = {};

		for (const userData of users) {
			const profileImage = userData.profile_image; // Related profile image

			let fullImageUrl = null;
			let smallImageUrl = null;

			if (profileImage) {
				fullImageUrl = await generateSignedUrl(profileImage.full_image_key);
				smallImageUrl = await generateSignedUrl(profileImage.small_image_key);
			}

			userMap[userData.id] = {
				username: userData.username ?? '',
				user_updated_at: userData.updated_at ?? null,
				filekey: profileImage?.small_image_key || null,
				full_image_url: fullImageUrl,
				small_image_url: smallImageUrl,
				profile_image_updated_at: profileImage?.uploaded_at || null,
			};
		}
		return json(userMap);
	} catch (error) {
		console.error('Error fetching users with profile images:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
