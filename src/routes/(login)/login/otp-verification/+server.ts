import { z } from 'zod';
import { getUserByEmail, getUserByPhone, updateUser } from '$lib/server/database/user.model';
import { lucia } from '$lib/server/auth';
import { triplitHttpClient } from '$lib/server/triplit';
import { isWithinExpirationDate } from '$lib/utils';
import { deleteEmailOTP, getEmailOTP } from '$lib/server/database/emailtoken.model';

const otpVerificationSchema = z.object({
	otp: z.string().length(6) // OTP should be exactly 6 characters
});

export async function POST({ request, cookies }) {
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

	// Get pending RSVP data from cookies
	let pendingRSVP = null;
	try {
		const rsvpCookie = cookies.get('pending_rsvp');
		if (rsvpCookie) {
			pendingRSVP = JSON.parse(rsvpCookie);
			// Check if data is not too old (30 minutes)
			if (Date.now() - pendingRSVP.timestamp > 30 * 60 * 1000) {
				pendingRSVP = null;
			}
		}
	} catch (e) {
		console.error('Error parsing pending RSVP data:', e);
		pendingRSVP = null;
	}

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
	// The email field in otpRecord could be an email or phone number
	let user = await getUserByEmail(otpRecord.email);

	// If not found by email, try by phone number
	if (!user) {
		user = await getUserByPhone(otpRecord.email);
	}

	if (!user) {
		return new Response(
			JSON.stringify({
				success: false,
				error: 'User not found'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	// Invalidate any existing sessions and update email verification status
	// await lucia.invalidateUserSessions(user.id);
	await updateUser(user.id, { email_verified: true });

	// Create a session for the user
	const session = await lucia.createSession(user.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);

	const triplitUser = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user').Where('id', '=', user.id)
	);

	// Handle pending RSVP redirect if exists
	let redirectLocation = triplitUser?.username ? '/dashboard' : '/profile/username';

	if (pendingRSVP && pendingRSVP.eventId) {
		// RSVP was already created in the login action, just redirect to event page
		redirectLocation = `/bonfire/${pendingRSVP.eventId}`;
		console.log(
			`Redirecting to event ${pendingRSVP.eventId} after successful login for user ${user.id}`
		);
	}

	const responseHeaders = new Headers();
	responseHeaders.set('Set-Cookie', sessionCookie.serialize());

	// Clear pending RSVP cookie even if no RSVP was processed
	if (pendingRSVP) {
		cookies.delete('pending_rsvp', { path: '/' });
	}

	return new Response(
		JSON.stringify({
			success: true,
			location: redirectLocation,
			sessionCookie: sessionCookie.serialize()
		}),
		{
			status: 200,
			headers: responseHeaders
		}
	);
}
