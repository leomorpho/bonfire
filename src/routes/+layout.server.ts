import { generateJWT, ANON_ROLE, USER_ROLE } from '$lib/auth';

import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async (event) => {
	const user = event.locals.user;
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);
		return { user: event.locals.user, jwt };
	}

	const jwt = generateJWT(null, ANON_ROLE);
	return {
		jwt: jwt
	};
});
