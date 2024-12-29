import { json } from '@sveltejs/kit';
import { serverTriplitClient } from '$lib/server/triplit';
import { generateSignedUrl } from '$lib/filestorage';

export const GET = async ({ url }) => {
	const userIds = url.searchParams.getAll('userIds'); // Get user IDs from query params

	if (!userIds || userIds.length === 0) {
		return json({ error: 'No user IDs provided' }, { status: 400 });
	}

	try {
		// Fetch profile images for the given user IDs
		const profileImageQuery = serverTriplitClient
			.query('profile_images')
			.where('user_id', 'in', userIds)
			.build();

		const profileImages = await serverTriplitClient.fetch(profileImageQuery);

		// Generate signed URLs and construct the map
		const profileImageMap = {};
		for (const image of profileImages) {
			const fullImageUrl = await generateSignedUrl(image.full_image_key);
			const smallImageUrl = await generateSignedUrl(image.small_image_key);
			profileImageMap[image.user_id] = {
				full_image_url: fullImageUrl,
				small_image_url: smallImageUrl
			};
		}

		return json(profileImageMap);
	} catch (error) {
		console.error('Error fetching profile images:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
