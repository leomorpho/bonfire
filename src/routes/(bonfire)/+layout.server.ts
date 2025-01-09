import { tempAttendeeIdStore, tempAttendeeIdUrlParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';
import { get } from 'svelte/store';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	// Get the optional `tempAttendeeId` from the query parameters
	let tempAttendeeId: string | null = event.url.searchParams.get(tempAttendeeIdUrlParam);

	if (tempAttendeeId) {
		tempAttendeeIdStore.set(tempAttendeeId);
	} else {
		tempAttendeeId = get(tempAttendeeIdStore);
	}

	// If the user is logged in, they will always be provided a user JWT
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
