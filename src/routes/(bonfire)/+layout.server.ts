import { generateUserJWT, USER_ROLE } from '$lib/jwt';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	if (!user) {
		return;
	}

	const jwt = generateUserJWT(user?.id as string, USER_ROLE);
	return {
		user: user,
		jwt: jwt
	};
};
