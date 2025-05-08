import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { triplitHttpClient } from './server/triplit';
import { and } from '@triplit/client';

export const USER_ROLE = 'user';
export const ADMIN_ROLE = 'admin';
export const ANON_ROLE = 'anon';
export const TEMP_ROLE = 'temp';

export function generateJWT(userId?: string | null, role: string = USER_ROLE) {
	const payload: Record<string, any> = {
		type: role // e.g., 'user' or 'admin'
	};

	// Conditionally add `userId`-related fields if `userId` is provided
	if (userId) {
		payload.sub = userId;
		payload.uid = userId;
		payload['x-triplit-user-id'] = userId;
	}

	const options = {
		expiresIn: '72h', // Token validity
		algorithm: 'HS256' // Use RS256 if you have a private/public key setup
	};

	return jwt.sign(payload, env.EXTERNAL_JWT_SECRET, options);
}

export const isOwnerOrAdmin = async (userId: string, eventId: string) => {
	const event = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('events').Where([
			and([
				['user_id', '=', userId],
				['id', '=', eventId]
			])
		])
	);

	if (event) {
		return true;
	}

	const admin = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('event_admins').Where([
			and([
				['user_id', '=', userId],
				['event_id', '=', eventId]
			])
		])
	);
	return !!admin;
};

export const isAttendee = async (
	userId: string | null,
	tempAttendeeId: string | null,
	eventId: string
) => {
	if (!userId && !tempAttendeeId) return false;

	if (userId) {
		const attendance = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('attendees').Where(
				and([
					['user_id', '=', userId],
					['event_id', '=', eventId]
				])
			)
		);

		return !!attendance;
	} else {
		const attendance = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('temporary_attendees').Where(
				and([
					['secret_mapping.id', '=', tempAttendeeId],
					['event_id', '=', eventId]
				])
			)
		);

		return !!attendance;
	}
};
