import { z } from 'zod';
import { getEmailOTP, deleteEmailOTP } from '$lib/server/database/emailtoken.model';
import { getUserByEmail, updateUser } from '$lib/server/database/user.model';
import { lucia } from '$lib/server/auth';
import { isWithinExpirationDate } from 'oslo';
import { triplitHttpClient } from '$lib/server/triplit';

const otpVerificationSchema = z.object({
	otp: z.string().length(6) // OTP should be exactly 6 characters
});

export async function POST({ request }) {
	// Parse the incoming request body
	const body = await request.json();
	const parsedData = otpVerificationSchema.safeParse(body);

	if (!parsedData.success) {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Invalid OTP format'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	const { otp } = parsedData.data;

	// Fetch the OTP record from the database
	const otpRecord = await getEmailOTP(otp);

	if (!otpRecord || !isWithinExpirationDate(otpRecord.expires_at)) {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Invalid or expired OTP'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	// Delete the OTP after use
	await deleteEmailOTP(otpRecord.id);

	// Retrieve the user associated with the OTP
	const user = await getUserByEmail(otpRecord.email);

	if (!user || user.email !== otpRecord.email) {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'User not found or email mismatch'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	// Invalidate any existing sessions and update email verification status
	await lucia.invalidateUserSessions(user.id);
	await updateUser(user.id, { email_verified: true });

	// Create a session for the user
	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);

	const triplitUser = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user').where('id', '=', user.id).build()
	);

	// Check if the user has a username for redirection
	const location = triplitUser?.username ? '/dashboard' : '/profile/username';

	return new Response(
		JSON.stringify({
			success: true,
			location: location,
			sessionCookie: sessionCookie.serialize()
		}),
		{
			status: 200,
			headers: {
				// location: location,
				'Set-Cookie': sessionCookie.serialize()
			}
		}
	);
}
