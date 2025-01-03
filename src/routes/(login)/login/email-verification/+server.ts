import { LOGIN_TYPE_ACTIVATION } from '$lib/enums';
import { lucia } from '$lib/server/auth';
import { deleteEmailToken, getEmailToken } from '$lib/server/database/emailtoken.model';
import { getUserById, updateUser } from '$lib/server/database/user.model';
import { triplitHttpClient } from '$lib/server/triplit.js';
import { isWithinExpirationDate } from 'oslo';

export async function GET({ request }): Promise<Response> {
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

	const query = triplitHttpClient.query('user').where('id', '=', user.id).build();

	let result = await triplitHttpClient.fetch(query);

	let location = '/dashboard';

	if (result.length == 0 || result[0].username.length == 0) {
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
