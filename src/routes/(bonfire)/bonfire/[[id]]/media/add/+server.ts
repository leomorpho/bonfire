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
import { createReadStream, createWriteStream } from 'fs';
import Busboy from 'busboy';

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

		const formData = (await parseMultipartStream(request)) as Map<string, string>;

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

async function parseMultipartStream(request: Request): Promise<Map<string, string>> {
	return new Promise((resolve, reject) => {
		const formData = new Map<string, string>();
		const headers = Object.fromEntries(request.headers); // Convert headers properly
		const busboy = Busboy({ headers });

		const files: Promise<void>[] = [];

		busboy.on('file', (fieldname, file, fileMeta) => {
			if (!fileMeta || typeof fileMeta.filename !== 'string') {
				console.error(`🚨 Invalid filename for field "${fieldname}":`, fileMeta);
				reject(new Error('Invalid file upload. Filename missing or invalid.'));
				return;
			}

			const { filename, mimeType } = fileMeta;
			console.log(`✅ Processing file: ${filename} (${mimeType})`);

			const tempFilePath = path.join(os.tmpdir(), filename);
			const writeStream = createWriteStream(tempFilePath);

			file.pipe(writeStream);

			const filePromise = new Promise<void>((res, rej) => {
				writeStream.on('finish', () => {
					console.log(`✅ File successfully written: ${tempFilePath}`);
					formData.set(fieldname, tempFilePath);
					formData.set('name', filename);
					formData.set('type', mimeType);
					res();
				});
				writeStream.on('error', (err) => {
					console.error(`❌ Error writing file: ${err.message}`);
					rej(err);
				});
			});

			files.push(filePromise);

			file.on('error', (err) => {
				console.error(`❌ Error reading file stream: ${err.message}`);
				reject(err);
			});
		});

		busboy.on('field', (fieldname, value) => {
			console.log(`📌 Processing field: ${fieldname} = ${value}`);
			formData.set(fieldname, value);
		});

		busboy.on('finish', async () => {
			try {
				console.log('✅ Busboy finished parsing.');
				await Promise.all(files); // Ensure all files are written before resolving
				resolve(formData);
			} catch (err) {
				console.error(`❌ Error during Busboy finish: ${err.message}`);
				reject(err);
			}
		});

		busboy.on('error', (err) => {
			console.error(`❌ Busboy error: ${err.message}`);
			reject(err);
		});

		try {
			// Correctly convert `request.body` to a Node.js readable stream
			const nodeStream = Readable.fromWeb(request.body);
			nodeStream.pipe(busboy);
		} catch (err) {
			console.error(`❌ Error piping request body: ${err.message}`);
			reject(err);
		}
	});
}
