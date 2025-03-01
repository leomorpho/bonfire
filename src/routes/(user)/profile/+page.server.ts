import { NUM_DEFAULT_LOGS_NEW_SIGNUP } from '$lib/enums.js';
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
		.query('user')
		.include('profile_image')
		.include('user_log_tokens')

		.where('id', '=', user.id)
		// .select(['full_image_key', 'small_image_key']) // TODO: select bug in http client
		.build();

	const userWithProfileImage = await triplitHttpClient.fetchOne(query);

	if (userWithProfileImage && !userWithProfileImage.user_log_tokens) {
		await triplitHttpClient.insert('user_log_tokens', {
			user_id: user.id,
			num_logs: NUM_DEFAULT_LOGS_NEW_SIGNUP
		});
	}

	let full_image_url = '';
	let small_image_url = '';

	if (userWithProfileImage && userWithProfileImage.profile_image) {
		full_image_url = await generateSignedUrl(userWithProfileImage.profile_image?.full_image_key);
		small_image_url = await generateSignedUrl(userWithProfileImage.profile_image?.small_image_key);
	}

	return {
		full_image_url: full_image_url,
		small_image_url: small_image_url,
		user: user
	};
};
