import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendSmsMessage } from '$lib/sms';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { userPhoneNumber, verificationCode } = await request.json();

	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}

	const msgBody = `${verificationCode} is your Bonfire verification code`;

	// Verify the code (implement your verification logic here)
	const success = await sendSmsMessage(user.id, userPhoneNumber, msgBody);

	if (success) {
		return json({ success: true, message: 'Verification code sent' });
	} else {
		return json({ success: false, message: 'Failed to send verification code.' }, { status: 400 });
	}
};
