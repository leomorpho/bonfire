import { ANON_ROLE, generateJWT, USER_ROLE } from '$lib/jwt';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	if (!user) {
		const jwt = generateJWT(undefined, ANON_ROLE);
		return { jwt };
		return;
	}

	const jwt = generateJWT(user?.id, USER_ROLE);
	return {
		user: user,
		jwt: jwt
	};
};
