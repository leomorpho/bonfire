import { LOGIN_TYPE_ACTIVATION, tempAttendeeIdUrlParam } from '$lib/enums';
import { lucia } from '$lib/server/auth';
import { deleteEmailToken, getEmailToken } from '$lib/server/database/emailtoken.model';
import { getUserById, updateUser } from '$lib/server/database/user.model';
import { triplitHttpClient } from '$lib/server/triplit.js';
import { and } from '@triplit/client';
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
		try {
			console.log('---> converting temp user to permament user');

			if (!triplitUser?.username) {
				triplitHttpClient.update('user', triplitUser?.id, async (e) => {
					e.username = existingAttendee.name;
				});
			}
			// Convert temp attendee to normal attendance
			await triplitHttpClient.insert('attendees', {
				user_id: user.id,
				event_id: existingAttendee.event_id as string,
				status: existingAttendee.status
			});

			// Convert all files imported by this temp attendee to the current user
			const files = await triplitHttpClient.fetch(
				triplitHttpClient
					.query('files')
					.where([
						and([
							['event_id', '=', existingAttendee.event_id],
							['temp_uploader_id', '=', existingAttendee.id]
						])
					])
					.build()
			);

			// Update each file to set uploader_id to the user's ID
			for (const file of files) {
				await triplitHttpClient.update('files', file.id, async (entity) => {
					entity.uploader_id = user.id;
				});
			}

			// Finally, delete the temp attendee, which means the user will only be able to see past
			// temp interactions with logged in user profile
			await triplitHttpClient.delete('temporary_attendees', tempAttendeeId as string);
		} catch (e) {
			console.error(
				`failed to link up temp attendee with id ${tempAttendeeId} to user with id ${user.id}`,
				e
			);
		}
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
