import { tempAttendeeIdUrlParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';
import { triplitHttpClient } from '$lib/server/triplit.js';
import { convertTempToPermanentUser } from '$lib/utils';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	// Get the optional `tempAttendeeId` from the query parameters
	const tempAttendeeId: string | null = event.url.searchParams.get(tempAttendeeIdUrlParam);

	// If the user is logged in, they will always be provided a user JWT
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);

		if (tempAttendeeId) {
			const existingAttendee = await triplitHttpClient.fetchById(
				'temporary_attendees',
				tempAttendeeId
			);

			if (existingAttendee) {
				const triplitUser = await triplitHttpClient.fetchOne(
					triplitHttpClient.query('user').where('id', '=', user.id).build()
				);
				await convertTempToPermanentUser(
					user.id,
					existingAttendee.event_id,
					triplitUser?.username,
					triplitUser?.id,
					existingAttendee.id,
					existingAttendee.name,
					existingAttendee.status
				);
			}
		}

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
