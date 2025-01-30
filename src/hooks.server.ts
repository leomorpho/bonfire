import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { taskRunner } from '$lib/scheduler';
import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { createServer } from 'http';
import { fetch as nodeFetch } from 'undici'; // Faster fetch for Node.js
import { EVENTS } from '@tus/server';
import { processGalleryFile } from '$lib/filestorage';
import { tempAttendeeSecretParam } from '$lib/enums';
import { triplitHttpClient } from '$lib/server/triplit';
import { env as publicEnv } from '$env/dynamic/public';


if (!dev) {
	Sentry.init({
		dsn: 'https://3b8c1776298855f9184a78a5d271ec6d@o4505031789314048.ingest.us.sentry.io/4508626481774592',
		tracesSampleRate: 1
	});
}

console.log('App started!');
console.log("PUBLIC_TRIPLIT_URL", publicEnv.PUBLIC_TRIPLIT_URL)

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
	maxSize: 500 * 1024 * 1024, // Set max size to 500MB
	respectForwardedHeaders: true // ✅ Important when behind a reverse proxy
});

// 🚀 Disable CORS Handling
tusServer.on('OPTIONS', (req, res) => {
    res.writeHead(204);
    res.end();
});

tusServer.on(EVENTS.POST_CREATE, async (req, res, upload) => {
	try {
		console.log('📥 New file upload started:', upload);

		return { res }; // Just return res, metadata will be saved with the upload object
	} catch (error) {
		console.error('❌ Error in POST_CREATE hook:', error);
		if (!res.headersSent) {
			res.writeHead(500);
			res.end('Internal Server Error');
		}
	}
});

tusServer.on(EVENTS.POST_FINISH, async (req, res, upload) => {
	try {
		console.log('✅ File upload complete:', upload);

		// Extract metadata directly from the upload object
		const filePath = `./uploads/${upload.id}`;
		const filename = upload.metadata.filename || upload.metadata.originalName || upload.id;
		const filetype = upload.metadata.filetype || upload.metadata.mimeType || 'unknown';
		const userId = upload.metadata.userId || null;
		const tempAttendeeSecret = upload.metadata.tempAttendeeSecret || null;
		const eventId = upload.metadata.eventId;

		console.log('📝 Processing with metadata:', {
			userId,
			tempAttendeeSecret,
			eventId,
			filename,
			filetype
		});

		if ((!userId && !tempAttendeeSecret) || !eventId) {
			console.warn('⚠️ Missing required metadata:', { userId, tempAttendeeSecret, eventId });
			return;
		}

		let tempAttendeeId: string | null = null;
		let existingTempAttendee = null;

		try {
			if (tempAttendeeSecret) {
				try {
					existingTempAttendee = await triplitHttpClient.fetchOne(
						triplitHttpClient
							.query('temporary_attendees')
							.where(['secret_mapping.id', '=', tempAttendeeSecret])
							.build()
					);
					if (existingTempAttendee) {
						tempAttendeeId = existingTempAttendee.id;
					}
				} catch (e) {
					console.debug('failed to find temp attendee because it does not exist', e);
				}
			}
		} catch (error) {
			console.error(`Error checking for temp attendee with secret ${tempAttendeeSecret}:`, error);
			return new Response('Internal Server Error', { status: 500 });
		}

		await processGalleryFile(filePath, filename, filetype, userId, tempAttendeeId, eventId);
		console.log('📸 Gallery file processed successfully');
	} catch (error) {
		console.error('❌ Error in POST_FINISH hook:', error);
	}
});

let server: any; // Store the server instance

function startTusServer() {
	server = createServer((req, res) => {
		console.log(`Incoming TUS request: ${req.url}`);
		tusServer.handle(req, res);
	});

	server.listen(3001, () => {
		console.log('TUS server running on http://localhost:3001');
	});
}

// Graceful shutdown on Vite restart
if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => {
		console.log('🛑 Stopping TUS server...');
		server.close(() => {
			console.log('✅ TUS server stopped.');
		});
	});
}

// Start the server
startTusServer();

/**
 * Middleware to intercept TUS uploads before SvelteKit
 */
const tusHandler: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/tus/files')) {
		console.log('🔹 TUS upload request detected');

		// Extract session and user details
		const sessionId = event.cookies.get(lucia.sessionCookieName);
		let userId: string | null = null;
		const tempAttendeeSecret = event.url.searchParams.get(tempAttendeeSecretParam) || '';
		const eventId = event.url.searchParams.get('eventId');

		let validUser = false;

		try {
			// ✅ Check if user is logged in with Lucia
			if (sessionId) {
				try {
					const { session, user } = await lucia.validateSession(sessionId);
					if (session) {
						userId = user.id;
						validUser = true;
					}
				} catch (error) {
					console.warn('⚠️ Invalid or expired session. Proceeding without authentication.', error);
				}
			}

			// ✅ Check if tempAttendeeSecret maps to a valid temporary attendee
			if (!validUser && tempAttendeeSecret) {
				const tempAttendee = await triplitHttpClient.fetchOne(
					triplitHttpClient
						.query('temporary_attendees')
						.where(['secret_mapping.id', '=', tempAttendeeSecret])
						.build()
				);
				if (tempAttendee) {
					validUser = true;
				}
			}
		} catch (error) {
			console.error('❌ Authentication error:', error);
		}

		// ❌ Reject if neither userId nor tempAttendeeSecret is valid
		if (!validUser) {
			console.warn('⚠️ Unauthorized attempt to upload.');
			return new Response('Unauthorized', { status: 401 });
		}

		// Validate eventId for POST and PATCH requests (new uploads and continuations)
		if ((event.request.method === 'POST' || event.request.method === 'PATCH') && !eventId) {
			console.warn('⚠️ Missing eventId in upload request');
			return new Response('Bad Request: Missing eventId', { status: 400 });
		}

		// Forward authentication and metadata to TUS server
		const headers = new Headers(event.request.headers);
		if (userId) headers.set('x-user-id', userId);
		if (tempAttendeeSecret) headers.set('x-temp-attendee-secret', tempAttendeeSecret);
		if (eventId) headers.set('x-event-id', eventId);

		try {
			const response = await nodeFetch(
				`http://localhost:3001${event.url.pathname}${event.url.search}`,
				{
					method: event.request.method,
					headers: Object.fromEntries(headers),
					body: event.request.body ? event.request.body : null
				}
			);

			return new Response(response.body, {
				status: response.status,
				headers: response.headers
			});
		} catch (error) {
			console.error('❌ Error forwarding request to TUS server:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
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
	authHandler, // ✅ Ensure authentication & session management
	tusHandler // ✅ Handle TUS uploads before SvelteKit
);

// Start the scheduler when the server starts
taskRunner();
export const handleError = Sentry.handleErrorWithSentry();
