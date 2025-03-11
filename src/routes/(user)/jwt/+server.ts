import { json } from '@sveltejs/kit';
import { tempAttendeeSecretParam } from '$lib/enums';
import { ANON_ROLE, generateJWT, USER_ROLE, TEMP_ROLE } from '$lib/jwt';
import { convertTempToPermanentUser, triplitHttpClient } from '$lib/server/triplit.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	// Get the user from locals
	const user = locals.user;

	// Get the optional tempAttendeeSecret from query parameters
	const tempAttendeeSecret: string | null = url.searchParams.get(tempAttendeeSecretParam);
	let existingAttendee = null;

	// Check if the temp attendee secret is provided and fetch the attendee
	if (tempAttendeeSecret) {
		existingAttendee = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees')
				.Where(['secret_mapping.id', '=', tempAttendeeSecret])
				
		);
	}

	// If the user is logged in, return a user JWT
	if (user) {
		const jwt = generateJWT(user.id, USER_ROLE);

		if (existingAttendee) {
			const triplitUser = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('user').Where('id', '=', user.id)
			);
			await convertTempToPermanentUser(
				user.id,
				existingAttendee.event_id,
				triplitUser?.username,
				triplitUser?.id,
				existingAttendee.id,
				existingAttendee.name,
				existingAttendee.status,
				existingAttendee.guest_count
			);
		}

		return json({ user, jwt });
	}

	// If a temporary attendee exists, return a temp user JWT
	if (existingAttendee) {
		const jwt = generateJWT(existingAttendee.id, TEMP_ROLE);
		return json({ jwt });
	}

	// Otherwise, return an anonymous JWT
	const jwt = generateJWT(undefined, ANON_ROLE);
	return json({ jwt });
};
