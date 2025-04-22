import { lucia } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { IncomingMessage, ServerResponse } from 'http';
import { EVENTS } from '@tus/server';
import { processGalleryFile, uploadBannerImage, uploadProfileImage } from '$lib/server/filestorage';
import { tempAttendeeSecretParam, UploadFileTypes } from '$lib/enums';
import { triplitHttpClient } from '$lib/server/triplit';
import { Readable } from 'stream';
import { EventEmitter } from 'events';

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
		const uploadFileType = upload.metadata.uploadFileType;

		console.log('📝 Processing with metadata:', {
			userId,
			tempAttendeeSecret,
			eventId,
			filename,
			filetype
		});

		if (!userId && !tempAttendeeSecret) {
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
							.Where(['secret_mapping.id', '=', tempAttendeeSecret])
							
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

		switch (uploadFileType) {
			case UploadFileTypes.GALLERY:
				await processGalleryFile(filePath, filename, filetype, userId, tempAttendeeId, eventId);
				console.log('📸 Gallery file processed successfully');
				break;
			case UploadFileTypes.BONFIRE_COVER_PHOTO:
				await uploadBannerImage(filePath, userId, eventId)
				break;
			case UploadFileTypes.PROFILE_PHOTO:
				await uploadProfileImage(filePath, userId);
				break;
			default:
				throw new Error(
					`unknown file type received by tus server: ${uploadFileType}, userId: ${userId}`
				);
		}
	} catch (error) {
		console.error('❌ Error in POST_FINISH hook:', error);
	}
});

async function toNodeRequest(request: Request): Promise<IncomingMessage> {
	console.log('📏 Creating Node.js-compatible request object');

	// Create readable stream directly from request body
	const readable = new Readable({
		read() {} // No-op to prevent auto-consumption
	});

	const req = Object.assign(readable, {
		method: request.method,
		url: new URL(request.url).pathname,
		headers: Object.fromEntries(request.headers),
		connection: { remoteAddress: '127.0.0.1' },
		httpVersion: '1.1',
		httpVersionMajor: 1,
		httpVersionMinor: 1,
		rawHeaders: [],
		rawTrailers: [],
		socket: new EventEmitter() as any
	});

	// ✅ Stream body instead of reading it upfront
	if (request.body) {
		if (dev) {
			console.log('📥 Streaming request body to TUS server...');
		}
		for await (const chunk of request.body as any) {
			readable.push(chunk);
		}
	}
	readable.push(null); // ✅ End the stream properly

	if (dev) {
		console.log('✅ Node.js request object created:', {
			method: req.method,
			url: req.url,
			headers: req.headers
		});
	}

	return req as IncomingMessage;
}

/**
 * Middleware to intercept TUS uploads before SvelteKit
 */
export const tusHandler: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/tus/files')) {
		console.log('🔹 TUS upload request detected');
		console.log('🔹 Request Method:', event.request.method);
		console.log('🔹 Request URL:', event.url.href);
		if (dev) {
			console.log('🔹 Incoming Headers:', Object.fromEntries(event.request.headers));
			console.log('🔹 Upload-Length:', event.request.headers.get('upload-length'));
		}

		// 📝 Clone the request before reading the body
		const clonedRequest = event.request.clone();

		// 🔍 Log body size without consuming the stream
		try {
			const rawBody = await clonedRequest.arrayBuffer();
			if (dev) {
				console.log('📏 Request body size:', rawBody.byteLength, 'bytes');
			}

			// 🔥 Check for unexpectedly empty PATCH body
			if (event.request.method === 'PATCH' && rawBody.byteLength === 0) {
				console.error('⚠️ PATCH request has an empty body, which may cause failures.');
			}
		} catch (err) {
			console.error('❌ Error reading request body:', err);
		}

		// Extract session and user details
		const sessionId = event.cookies.get(lucia.sessionCookieName);
		let userId: string | null = null;
		const tempAttendeeSecret =
			event.request.headers.get('x-temp-attendee-secret') ||
			event.url.searchParams.get(tempAttendeeSecretParam) ||
			'';
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
						.Where(['secret_mapping.id', '=', tempAttendeeSecret])
						
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

		// // Validate eventId for POST and PATCH requests (new uploads and continuations)
		// if (event.request.method === 'POST' && !eventId) {
		// 	console.warn('⚠️ Missing eventId in upload request');
		// 	return new Response('Bad Request: Missing eventId', { status: 400 });
		// }

		// Forward authentication and metadata to TUS server
		const headers = new Headers(event.request.headers);
		if (userId) headers.set('x-user-id', userId);
		if (tempAttendeeSecret) headers.set('x-temp-attendee-secret', tempAttendeeSecret);
		if (eventId) headers.set('x-event-id', eventId);

		const req = await toNodeRequest(event.request);
		const res = new ServerResponse(req);

		// ✅ Handle the request with TUS and return its response
		return new Promise((resolveResponse) => {
			tusServer
				.handle(req, res)
				.then(() => {
					const headers = new Headers();
					Object.entries(res.getHeaders()).forEach(([key, value]) => {
						if (value) headers.set(key, String(value));
					});
					if (dev) {
						console.log('✅ TUS Request Handled - Response:', {
							status: res.statusCode,
							headers: Object.fromEntries(headers)
						});
					}

					resolveResponse(
						new Response(res.statusCode === 204 ? null : res.outputData[0]?.data, {
							status: res.statusCode,
							headers
						})
					);
				})
				.catch((err) => {
					console.error('❌ Error handling TUS request:', err);
					resolveResponse(new Response('Internal Server Error', { status: 500 }));
				});
		});
	}

	return resolve(event);
};
