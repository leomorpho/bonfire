import { generateJWT, USER_ROLE } from '$lib/jwt';
import { serverTriplitClient } from '$lib/triplit.js';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	const jwt = generateJWT(user?.id as string, USER_ROLE);

	let client = serverTriplitClient;

	const query = client.query('user').where('id', '=', user.id).build();
	let result = await client.fetch(query);

	if (result.length == 0) {
		await client.insert('user', { id: user.id, username: '' });
		result = await client.fetch(query);
		throw redirect(302, '/profile/username');
	}

	return {
		user: user,
		jwt: jwt
	};
};
