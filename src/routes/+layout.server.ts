import { generateJWT, ANON_ROLE } from '$lib/auth';

import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async (event) => {
	const jwt = generateJWT(null, ANON_ROLE);

	return {
		jwt: jwt
	};
});
