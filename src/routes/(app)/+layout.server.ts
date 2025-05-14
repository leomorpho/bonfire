import { generateJWT, USER_ROLE } from '$lib/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (e) => {
	const user = e.locals.user;
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);
		return { user: e.locals.user, jwt };
	}

	return {};
};
