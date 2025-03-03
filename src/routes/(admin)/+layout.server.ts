import { generateJWT, ADMIN_ROLE } from '$lib/jwt';
import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	if (!user.is_event_styles_admin) {
		throw redirect(302, '/'); // Redirect to login if not authenticated
	}

	const jwt = generateJWT(user?.id, ADMIN_ROLE);
	console.log('jwt', jwt);
	
	return {
		user: user,
		jwt: jwt
	};
};
