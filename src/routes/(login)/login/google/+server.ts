import { google } from '$lib/server/auth';
import { generateState, generateCodeVerifier } from 'arctic';
import { redirect } from '@sveltejs/kit';

import type { RequestEvent } from '@sveltejs/kit';
import { dev } from '$app/environment';

export async function GET(event: RequestEvent): Promise<Response> {
	// Get RSVP data from query params
	const eventId = event.url.searchParams.get('eventId');
	const rsvpStatus = event.url.searchParams.get('rsvpStatus');
	const numGuests = event.url.searchParams.get('numGuests');

	// Store RSVP data in cookies if provided
	if (eventId && rsvpStatus) {
		const rsvpData = {
			eventId,
			rsvpStatus,
			numGuests: numGuests ? parseInt(numGuests, 10) : 0,
			timestamp: Date.now()
		};
		event.cookies.set('pending_rsvp', JSON.stringify(rsvpData), {
			path: '/',
			maxAge: 60 * 30, // 30 minutes
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax'
		});
	}

	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = await google.createAuthorizationURL(state, codeVerifier, [
		'https://www.googleapis.com/auth/userinfo.email',
		'openid'
	]);
	event.cookies.set('code_verifier', codeVerifier, {
		secure: !dev, // set to false in localhost
		path: '/',
		httpOnly: true,
		maxAge: 60 * 10 // 10 min
	});

	event.cookies.set('google_oauth_state', state, {
		path: '/',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	redirect(302, url.toString());
}
