import {
	extractFirstFrameAndBlurHash,
	transcodeAndUploadVideo,
	uploadLargeFileToS3
} from '$lib/filestorage';
import { Readable } from 'stream';
import { error, redirect } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import sharp from 'sharp';
import type { HttpClient } from '@triplit/client';
import { createNewFileNotificationQueueObject } from '$lib/notification';
import { tempAttendeeSecretParam } from '$lib/enums';
import { encode } from 'blurhash';
import { getPixels } from '@unpic/pixels';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { createReadStream } from 'fs';

export const POST = async ({ url, locals, params, request }): Promise<Response> => {
	const tempAttendeeSecret = url.searchParams.get(tempAttendeeSecretParam);

	let tempAttendeeExists: boolean = false;
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
					tempAttendeeExists = true;
				}
			} catch (e) {
				console.debug('failed to find temp attendee because it does not exist', e);
			}
		}
	} catch (error) {
		console.error(`Error checking for temp attendee with secret ${tempAttendeeSecret}:`, error);
		return new Response('Internal Server Error', { status: 500 });
	}

	try {
		const user = locals.user;

		if (!user && !tempAttendeeExists) {
			redirect(302, '/login');
		}

		const { id } = params;

		if (!id) {
			throw error(400, 'Missing ID parameter'); // Return 400 if `id` is not provided
		}

		const contentType = request.headers.get('content-type') || '';
		const boundaryMatch = contentType.match(/boundary=(.+)$/);

		if (!boundaryMatch) {
			return new Response('Invalid multipart form', { status: 400 });
		}

		const boundary = boundaryMatch[1];
		const formData = await parseMultipart(request, boundary);

		const fileTempPath = formData.get('file');
		if (!fileTempPath || typeof fileTempPath !== 'string') {
			throw new TypeError('No valid file uploaded');
		}

		// Get user-like ID for either user or tempUserAttendee
		const userIdForCurrentUserType = user ? user.id : existingTempAttendee?.id;

		// Extract file from formData
		const filename = formData.get('name');
		const filetype = formData.get('type');
		// const fileSize = file.length; // Get the file size in bytes // That needs to be updated to read from the filepath
		const fileStream = createReadStream(fileTempPath);

		const fileKey = `events/eventid_${id}/userid_${userIdForCurrentUserType}/${filename}`;
		let frameFileId = null;

		// Initialize metadata
		let h_pixel: number | null = null;
		let w_pixel: number | null = null;
		let blurhash: string | null = null;

		let cleanup: (() => Promise<void>) | null = null;

		// Extract dimensions if applicable
		if (filetype.startsWith('image/')) {
			// Images: Use `sharp`
			const metadata = await sharp(fileTempPath).metadata();
			h_pixel = metadata.height || null;
			w_pixel = metadata.width || null;

			try {
				// Process the image buffer with sharp
				const processedBuffer = await sharp(fileTempPath).toFormat('png').toBuffer();
				// Use `getPixels` on the processed buffer
				const pixelData = await getPixels(processedBuffer);
				const data = Uint8ClampedArray.from(pixelData.data);

				// Generate the BlurHash
				blurhash = encode(data, pixelData.width, pixelData.height, 4, 4);
			} catch (e) {
				console.log('failed to generate the blurhash for this image', e);
			}
			try {
				await uploadLargeFileToS3({
					fileStream,
					key: fileKey,
					contentType: filetype
				});
			} catch (e) {
				console.log(`"failed to upload image with key ${fileKey} to s3`, e);
				throw error(500);
			}
		} else if (filetype.startsWith('video/')) {
			try {
				// TODO: run extractFirstFrameAndBlurHash in a task and use a default video placeholder while there is no extracted frame. It
				// takes too long to do it synchronously.
				const {
					blurhash: videoBlurHash,
					tempImagePath,
					cleanup: tempCleanup
				} = await extractFirstFrameAndBlurHash(fileTempPath);

				const video_frame_blurhash = videoBlurHash;
				cleanup = tempCleanup;
				blurhash = videoBlurHash;

				// Extract metadata for the frame
				const frameMetadata = await sharp(tempImagePath).metadata();
				const video_frame_h_pixel = frameMetadata.height || null;
				const video_frame_w_pixel = frameMetadata.width || null;
				h_pixel = video_frame_h_pixel;
				w_pixel = video_frame_w_pixel;
				const video_frame_file_size = (await fs.stat(tempImagePath)).size;

				// Upload extracted frame
				const frameFileKey = `events/eventid_${id}/userid_${userIdForCurrentUserType}/frame-${filename}`;
				const frameStream = Readable.from(await fs.readFile(tempImagePath));

				await uploadLargeFileToS3({
					fileStream: frameStream,
					key: frameFileKey,
					contentType: 'image/png'
				});

				const { output } = await triplitHttpClient.insert('files', {
					uploader_id: user?.id ?? null,
					temp_uploader_id: existingTempAttendee?.id ?? null,
					event_id: id,
					file_key: frameFileKey,
					file_type: 'image/png',
					file_name: `frame-${filename}`,
					size_in_bytes: video_frame_file_size,
					h_pixel: video_frame_h_pixel,
					w_pixel: video_frame_w_pixel,
					blurr_hash: video_frame_blurhash,
					is_linked_file: true
				});
				frameFileId = output.id;
			} catch (err) {
				console.error('Failed to process video file:', err);
				// Delete S3 file and triplit file
			} finally {
				if (cleanup) {
					await cleanup(); // Cleanup temporary files
				}
			}
			try {
				await transcodeAndUploadVideo(fileTempPath, fileKey);
			} catch (e) {
				console.log(`"failed to upload video with key ${fileKey} to s3`, e);
				throw error(500);
			}
		}

		// Create database entry
		// TODO: once transactions are supported in HTTP client, add one here
		const fileTx = await triplitHttpClient.insert('files', {
			uploader_id: user?.id ?? null,
			temp_uploader_id: existingTempAttendee?.id ?? null,
			event_id: id,
			file_key: fileKey,
			file_type: filetype,
			file_name: filename,
			size_in_bytes: (await await fs.stat(fileTempPath)).size,
			h_pixel: h_pixel,
			w_pixel: w_pixel,
			blurr_hash: blurhash,
			linked_file_id: frameFileId ?? null
		});

		await createNewFileNotificationQueueObject(
			triplitHttpClient as HttpClient,
			userIdForCurrentUserType as string,
			id,
			[fileTx?.output?.id as string]
		);

		return new Response(JSON.stringify({ message: 'File uploaded successfully', fileKey }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		// Delete S3 file and triplit file
		console.error('Error uploading file:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};

// Utility function to parse multipart form data
async function parseMultipart(request: Request, boundary: string) {
	const buffer = await request.arrayBuffer();
	const data = Buffer.from(buffer); // Use Buffer for binary-safe handling
	const parts = data.toString('binary').split(`--${boundary}`);
	const formData = new Map<string, any>();

	for (const part of parts) {
		// Match the content-disposition header
		const match = part.match(
			/Content-Disposition: form-data; name="([^"]+)"(; filename="([^"]+)")?/i
		);
		if (!match) continue;

		const name = match[1];
		const filename = match[3];
		const contentIndex = part.indexOf('\r\n\r\n') + 4;

		if (contentIndex < 4 || part.trim().endsWith('--')) {
			continue; // Skip empty or incomplete parts
		}

		if (filename) {
			// Save binary file content to a temp file
			const tempFilePath = path.join(os.tmpdir(), filename);
			const content = part.slice(contentIndex, part.lastIndexOf('\r\n'));
			await fs.writeFile(tempFilePath, content, 'binary');
			formData.set(name, tempFilePath); // Store the file path instead of binary content
			formData.set('name', filename);
		} else {
			// Text content
			const content = part.slice(contentIndex, part.lastIndexOf('\r\n')).trim();
			formData.set(name, content);
		}
	}

	return formData;
}
