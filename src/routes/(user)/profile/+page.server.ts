import { generateSignedUrl } from '$lib/filestorage.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	const query = triplitHttpClient
		.query('profile_images')
		.where('user_id', '=', user.id)
		// .select(['full_image_key', 'small_image_key']) // TODO: select bug in http client
		.build();

	const profileImage = await triplitHttpClient.fetchOne(query);

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
