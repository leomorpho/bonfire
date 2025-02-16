import { HttpClient } from '@triplit/client';
import { generateId } from 'lucia';
import { TimeSpan, createDate } from 'oslo';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

export const triplitHttpClient = new HttpClient({
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

export const deleteAllEmailOTPsForUser = async (userId: string) => {
	await triplitHttpClient.delete('email_verification_otp', userId);
};

export const createEmailVerificationOTP = async (
	userId: string,
	email: string
): Promise<string> => {
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const otpId = generateId(40);
	const expirationTime = createDate(new TimeSpan(15, 'm'));

	await triplitHttpClient.insert('email_verification_otp', {
		id: otpId,
		user_id: userId,
		email,
		otp,
		expires_at: expirationTime
	});
	return formatOtp(otp);
};

export const deleteEmailOTP = async (otp: string) => {
	await triplitHttpClient.delete('email_verification_otp', otp);
};

export const getEmailOTP = async (otpStr: string) => {
	return await triplitHttpClient.fetchOne(
		triplitHttpClient.query('email_verification_otp').where('otp', '=', otpStr).build()
	);
};

/**
 * Format a 6-digit OTP into the format "123 542"
 * @param otp - The 6-digit OTP to be formatted
 * @returns Formatted OTP as a string
 */
const formatOtp = (otp: string): string => {
	// Ensure the OTP is a 6-digit string
	if (otp.length !== 6) {
		throw new Error('OTP must be a 6-digit number');
	}

	// Format the OTP as "123 542"
	return otp.slice(0, 3) + ' ' + otp.slice(3);
};
