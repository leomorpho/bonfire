import { LOGIN_TYPE_ACTIVATION, tempAttendeeIdUrlParam } from '$lib/enums';
import { lucia } from '$lib/server/auth';
import { deleteEmailToken, getEmailToken } from '$lib/server/database/emailtoken.model';
import { getUserById, updateUser } from '$lib/server/database/user.model';
import { convertTempToPermanentUser, triplitHttpClient } from '$lib/server/triplit.js';
import { isWithinExpirationDate } from 'oslo';

export async function GET({ url, request }): Promise<Response> {
	const verificationToken = new URL(request.url).searchParams.get('verification_token');
	console.log('Verification Token:', verificationToken);
	if (!verificationToken) {
		console.log('No verification token provided');
		return new Response('No verification token provided', { status: 400 });
	}

	const email_token = await getEmailToken(verificationToken);

	if (email_token) {
		deleteEmailToken(verificationToken);
	}

	if (!email_token || !isWithinExpirationDate(email_token.expires_at)) {
		console.error('Invalid or expired email token');
		return new Response('error', { status: 400 });
	}

	const loginType = new URL(request.url).searchParams.get('login_type');
	if (loginType == LOGIN_TYPE_ACTIVATION) {
		// TODO: wtf? why is that empty
	}

	const user = await getUserById(email_token.user_id);
	if (!user || user.email !== email_token.email) {
		console.error('Invalid user or email mismatch', user, email_token);
		return new Response(null, {
			status: 400
		});
	}

	await lucia.invalidateUserSessions(user.id);
	await updateUser(user.id, { email_verified: true });

	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);

	// If user has a temp attendee, link up to account
	const tempAttendeeId = url.searchParams.get(tempAttendeeIdUrlParam);

	const triplitUser = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user').where('id', '=', user.id).build()
	);

	let existingAttendee = null;

	if (tempAttendeeId) {
		existingAttendee = await triplitHttpClient.fetchById('temporary_attendees', tempAttendeeId);
	}
	if (existingAttendee) {
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

	let location = '/dashboard';

	if (!triplitUser || triplitUser.username.length == 0) {
		location = '/profile/username';
	}

	return new Response(null, {
		status: 302,
		headers: {
			location: location,
			'Set-Cookie': sessionCookie.serialize()
		}
	});
}
