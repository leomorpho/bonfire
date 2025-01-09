import { tempAttendeeIdUrlParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';
import { triplitHttpClient } from '$lib/server/triplit.js';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	// Get the optional `tempAttendeeId` from the query parameters
	const tempAttendeeId: string | null = event.url.searchParams.get(tempAttendeeIdUrlParam);

	// If the user is logged in, they will always be provided a user JWT
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);

		if (tempAttendeeId) {
			// Make sure user has an attendance object for tempAttendeeId
			try {
				const temp = await triplitHttpClient.fetchById('temporary_attendees', tempAttendeeId);

				if (!temp) {
					throw new Error('temp attendee object does not exist');
				}

				await triplitHttpClient.insert('attendees', {
					event_id: temp.event_id,
					user_id: user.id,
					status: temp.status
				});

				await triplitHttpClient.delete('temporary_attendees', tempAttendeeId);
			} catch (e) {
				console.log(
					`failed to create regular user attendance from passed param tempAttendeeId ${tempAttendeeId}`,
					e
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
