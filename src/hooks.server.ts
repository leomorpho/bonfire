import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { taskRunner } from '$lib/scheduler';
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env as publicEnv } from '$env/dynamic/public';
import type { ServerInit } from '@sveltejs/kit';
import { tusHandler } from '$lib/server/tus';
// import { initializeDatabaseSchemas } from '$lib/server/migrations';

export const init: ServerInit = async () => {
	if (!dev) {
		Sentry.init({
			dsn: 'https://3b8c1776298855f9184a78a5d271ec6d@o4505031789314048.ingest.us.sentry.io/4508626481774592',
			tracesSampleRate: 1,
			environment: publicEnv.PUBLIC_ENVIRONMENT
		});
	}

	console.log('App started!');
	console.log('PUBLIC_TRIPLIT_URL', publicEnv.PUBLIC_TRIPLIT_URL);

	process.on('uncaughtException', (err) => {
		console.error('Uncaught Exception:', err.stack || err.message || err);
	});

	process.on('unhandledRejection', (reason, promise) => {
		console.error('Unhandled Rejection at:', promise, 'reason:', reason);
	});

	// initializeDatabaseSchemas().catch(console.error);
};

/**
 * Middleware for authentication
 */
const authHandler: Handle = async ({ event, resolve }) => {
	try {
		const sessionId = event.cookies.get(lucia.sessionCookieName);
		if (!sessionId) {
			event.locals.user = null;
			event.locals.session = null;
			return resolve(event);
		}

		const { session, user } = await lucia.validateSession(sessionId);
		if (session && session.fresh) {
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		if (!session) {
			const sessionCookie = lucia.createBlankSessionCookie();
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		}
		event.locals.user = user;
		event.locals.session = session;

		return resolve(event);
	} catch (error) {
		console.error('Error in auth handler:', error);
		throw error;
	}
};

// 🔹 Compose all handlers using `sequence`
export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	authHandler, // ✅ Ensure authentication & session management
	tusHandler // ✅ Handle TUS uploads before SvelteKit
);

// Start the scheduler when the server starts
taskRunner();
export const handleError = Sentry.handleErrorWithSentry();
