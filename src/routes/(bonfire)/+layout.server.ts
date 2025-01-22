import { tempAttendeeSecretParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';
import { convertTempToPermanentUser, triplitHttpClient } from '$lib/server/triplit.js';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	// Get the optional `tempAttendeeSecret` from the query parameters
	const tempAttendeeSecret: string | null = event.url.searchParams.get(tempAttendeeSecretParam);
	let existingAttendee;

	if (tempAttendeeSecret) {
		existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees')
				.where(['secret_mapping.id', '=', tempAttendeeSecret])
				.build()
		);
	}

	// If the user is logged in, they will always be provided a user JWT
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);

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

		return {
			user: user,
			jwt: jwt
		};
	} else if (existingAttendee) {
		const jwt = generateJWT(existingAttendee.id, TEMP_ROLE);
		return { jwt };
	} else {
		const jwt = generateJWT(undefined, ANON_ROLE);
		return { jwt };
	}
};
