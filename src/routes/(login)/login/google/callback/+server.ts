import { google, lucia } from '$lib/server/auth';
import { OAuth2RequestError } from 'arctic';
import { generateId } from 'lucia';
import type { RequestEvent } from '@sveltejs/kit';
import { createNewUser, getUserByEmail } from '$lib/server/database/user.model';
import jwt from 'jsonwebtoken';

// Function to parse JWT and extract payload
function parseJWT(token: string) {
	try {
		return jwt.decode(token);
	} catch (error) {
		console.error('Error decoding JWT:', error);
		return null;
	}
}

type GoogleUser = {
	iss: string;
	azp: string;
	aud: string;
	sub: string;
	email: string;
	email_verified: boolean;
	at_hash: string;
	nonce: string;
	iat: number;
	exp: number;
};

export async function GET(event: RequestEvent): Promise<Response> {
	console.log('GET /login/google/callback');
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');
	const stored_state = event.cookies.get('google_oauth_state') ?? null;
	const code_verifier = event.cookies.get('code_verifier') ?? null;
	if (!code || !state || !stored_state || state !== stored_state || !code_verifier) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, code_verifier);
		const idToken = tokens.data.id_token;

		if (!idToken || typeof idToken !== 'string') {
			throw new Error('Invalid idToken received');
		}

		const google_user = parseJWT(idToken) as GoogleUser;
		if (!google_user || !google_user.email) {
			console.error('Failed to decode JWT or email is missing');
			return new Response(null, {
				status: 400
			});
		}

		let user = await getUserByEmail(google_user.email);

		if (!user) {
			const user_id = generateId(15);
			user = await createNewUser({
				id: user_id,
				email: google_user.email,
				email_verified: true,
				num_logs: 3,
				is_event_styles_admin: false
			});
			if (!user) {
				console.error('Failed to create user for ' + google_user.email);
				return new Response(null, {
					status: 500
				});
			}
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/dashboard'
			}
		});
	} catch (e) {
		console.error(e);
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}
