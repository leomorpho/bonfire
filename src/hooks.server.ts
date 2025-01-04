import { taskRunner } from '$lib/scheduler';
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

console.log('App started!');

process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err.stack || err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export const handle: Handle = async ({ event, resolve }) => {
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
			// sveltekit types deviates from the de-facto standard
			// you can use 'as any' too
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
		console.error('Error in handle:', error);
		throw error;
	}
};

// Start the scheduler when the server starts
taskRunner();
