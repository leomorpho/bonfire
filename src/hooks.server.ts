import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { taskRunner } from '$lib/scheduler';
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { Readable } from 'stream';
import { createServer } from 'http';
import { fetch as nodeFetch } from 'undici'; // Faster fetch for Node.js
import { processGalleryFile } from '$lib/filestorage';

if (!dev) {
	Sentry.init({
		dsn: 'https://3b8c1776298855f9184a78a5d271ec6d@o4505031789314048.ingest.us.sentry.io/4508626481774592',
		tracesSampleRate: 1
	});
}

console.log('App started!');

process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err.stack || err.message || err);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

/**
 * Setup the TUS server
 */
const tusServer = new Server({
	path: '/api/tus/files',
	datastore: new FileStore({ directory: './uploads' }),
	maxSize: 500 * 1024 * 1024 // Set max size to 500MB
});

/**
 * ✅ Trigger custom logic when an upload is complete
 */
tusServer.on('uploadComplete', async (req, res, file) => {
	console.log(`📌 Upload completed: ${file.id}`);

	// Debug: Check if metadata exists
	console.log('📊 File metadata:', file.metadata);

	const filePath = `./uploads/${file.id}`; // ✅ Path where TUS stores the file
	const filename = file.metadata.name; // ✅ Extract original filename
	const filetype = file.metadata.type; // ✅ Extract MIME type
	const eventId = file.metadata.eventId; // ✅ Extract event ID
	const userId = file.metadata.userId; // ✅ Extract uploader's ID

	
	// ✅ Run processing logic asynchronously
	await processGalleryFile(filePath, filename, filetype, userId, eventId);
});

// ✅ Start a native HTTP server for TUS
const server = createServer((req, res) => {
	console.log(`Incoming TUS request: ${req.url}`);
	tusServer.handle(req, res);
});

server.listen(3001, () => {
	console.log('TUS server running on http://localhost:3001');
});

/**
 * Middleware to intercept TUS uploads before SvelteKit
 */
const tusHandler: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/tus/files')) {
		console.log('🔹 Forwarding request to TUS server');

		// ✅ Forward request to standalone TUS server
		const response = await nodeFetch(`http://localhost:3001${event.url.pathname}`, {
			method: event.request.method,
			headers: Object.fromEntries(event.request.headers),
			body: event.request.body ? event.request.body : null
		});

		// ✅ Return the TUS server's response to the frontend
		return new Response(response.body, { status: response.status, headers: response.headers });
	}

	return resolve(event);
};

/**
 * Middleware for authentication and body size increase
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

		// Increase body size limit for video uploads
		event.request.headers.set('content-length', '100000000'); // 100MB limit

		return resolve(event);
	} catch (error) {
		console.error('Error in auth handler:', error);
		throw error;
	}
};

// 🔹 Compose all handlers using `sequence`
export const handle: Handle = sequence(
	Sentry.sentryHandle(),
	tusHandler, // ✅ Handle TUS uploads before SvelteKit
	authHandler // ✅ Ensure authentication & session management
);

// Start the scheduler when the server starts
taskRunner();
export const handleError = Sentry.handleErrorWithSentry();
