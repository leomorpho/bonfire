import { tempAttendeeIdUrlParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	// Get the optional `tempAttendeeId` from the query parameters
	const tempAttendeeId = event.url.searchParams.get(tempAttendeeIdUrlParam);

	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);
		return {
			user: user,
			jwt: jwt
		};
	} else if (tempAttendeeId) {
		const jwt = generateJWT(tempAttendeeId, TEMP_ROLE);
		return { jwt };
	} else {
		const jwt = generateJWT(undefined, ANON_ROLE);
		return { jwt };
	}
};
