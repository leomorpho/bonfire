import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export const USER_ROLE = 'user';
export const ADMIN_ROLE = 'admin';
export const ANON_ROLE = 'anon';

export function generateJWT(userId?: string, role: string = USER_ROLE) {
	const payload: Record<string, any> = {
		type: role, // e.g., 'user' or 'admin'
	};

	// Conditionally add `userId`-related fields if `userId` is provided
	if (userId) {
		payload.sub = userId;
		payload.uid = userId;
		payload['x-triplit-user-id'] = userId;
	}

	const options = {
		expiresIn: '24h', // Token validity
		algorithm: 'HS256' // Use RS256 if you have a private/public key setup
	};

	return jwt.sign(payload, env.EXTERNAL_JWT_SECRET, options);
}
