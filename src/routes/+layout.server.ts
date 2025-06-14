import { generateJWT, ANON_ROLE, USER_ROLE, ADMIN_ROLE } from '$lib/auth';

import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async (event) => {
	const user = event.locals.user;
	if (user) {
		// Check if user is admin and generate appropriate JWT
		const role = user.is_event_styles_admin ? ADMIN_ROLE : USER_ROLE;
		const jwt = generateJWT(user.id, role);
		return { user: event.locals.user, jwt };
	}

	const jwt = generateJWT(null, ANON_ROLE);
	return {
		jwt: jwt
	};
});
