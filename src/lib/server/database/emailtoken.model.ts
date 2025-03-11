import { eq } from 'drizzle-orm';
import { db } from './db';
import { emailVerificationOtpTable, emailVerificationTokenTable } from './schema';
import { generateId } from 'lucia';
import { TimeSpan, createDate } from 'oslo';

export const deleteAllEmailTokensForUser = async (userId: string) => {
	await db
		.delete(emailVerificationTokenTable)
		.where(eq(emailVerificationTokenTable.user_id, userId));
};

// NOTE: deprecating
export const createEmailVerificationToken = async (
	userId: string,
	email: string
): Promise<string> => {
	const tokenId = generateId(40);
	await db.insert(emailVerificationTokenTable).values({
		id: tokenId,
		user_id: userId,
		email,
		expires_at: createDate(new TimeSpan(2, 'h'))
	});
	return tokenId;
};

export const deleteEmailToken = async (tokenId: string) => {
	await db.delete(emailVerificationTokenTable).where(eq(emailVerificationTokenTable.id, tokenId));
};

export const getEmailToken = async (tokenId: string) => {
	const token = await db
		.select()
		.from(emailVerificationTokenTable)
		.where(eq(emailVerificationTokenTable.id, tokenId));
	if (token.length === 0) {
		return null;
	} else {
		return token[0];
	}
};

// Email One-Time Password (OTP)
export const deleteAllEmailOTPsForUser = async (userId: string) => {
	await db.delete(emailVerificationOtpTable).where(eq(emailVerificationOtpTable.user_id, userId));
};

export const createEmailVerificationOTP = async (
	userId: string,
	email: string
): Promise<string> => {
	// Generate a random 6-digit OTP
	const otp = Math.floor(100000 + Math.random() * 900000).toString();

	const otpId = generateId(40); // You can modify the length of the ID here
	const expirationTime = createDate(new TimeSpan(15, 'm')); // OTP expires in 15 minutes

	// Insert the OTP into the table
	await db.insert(emailVerificationOtpTable).values({
		id: otpId,
		user_id: userId,
		email,
		otp,
		expires_at: expirationTime
	});

	return formatOtp(otp); // Returning OTP (you may also choose to return OTPId if preferred)
};

export const deleteEmailOTP = async (otp: string) => {
	await db.delete(emailVerificationOtpTable).where(eq(emailVerificationOtpTable.otp, otp));
};

export const getEmailOTP = async (otpStr: string) => {
	const otp = await db
		.select()
		.from(emailVerificationOtpTable)
		.where(eq(emailVerificationOtpTable.otp, otpStr));

	if (otp.length === 0) {
		return null;
	} else {
		return otp[0];
	}
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
