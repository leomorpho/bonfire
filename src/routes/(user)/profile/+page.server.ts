import { generateSignedUrl } from '$lib/filestorage.js';
import { serverTriplitClient } from '$lib/server/triplit';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	const query = serverTriplitClient
		.query('profile_images')
		.where('user_id', '=', user.id)
		.select(['full_image_key', 'small_image_key'])
		.build();

	const profileImage = await serverTriplitClient.fetchOne(query);

	let full_image_url = '';
	let small_image_url = '';
    
	if (profileImage) {
		full_image_url = await generateSignedUrl(profileImage?.full_image_key);
		small_image_url = await generateSignedUrl(profileImage?.small_image_key);
	}

	return {
		full_image_url: full_image_url,
		small_image_url: small_image_url,
		user: user
	};
};
