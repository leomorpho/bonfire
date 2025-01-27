import { extractFirstFrameAndBlurHash, uploadLargeFileToS3 } from '$lib/filestorage';
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
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


// Create an S3 client
const s3Client = new S3Client({
	region: env.S3_REGION, // Your Backblaze region
	endpoint: env.S3_ENDPOINT,
	credentials: {
		accessKeyId: dev ? env.DEV_S3_ACCESS_KEY_ID : env.S3_ACCESS_KEY_ID,
		secretAccessKey: dev ? env.DEV_S3_SECRET_ACCESS_KEY : env.S3_SECRET_ACCESS_KEY
	}
});

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


		const { id: eventId } = params;
		if (!eventId) {
		  return new Response('Missing event ID', { status: 400 });
		}
	
		const { filename, contentType, size } = await request.json();
		if (!filename || !contentType || !size) {
		  return new Response('Missing required metadata', { status: 400 });
		}

		
		const bucketName = dev ? env.DEV_S3_BUCKET_NAME : env.S3_BUCKET_NAME;
		// Get user-like ID for either user or tempUserAttendee
		const userIdForCurrentUserType = user ? user.id : existingTempAttendee?.id;

		let fileKey  ='';

		if (user){
			 fileKey = `events/eventid_${eventId}/userid_${user?.id}/${filename}`;

		}else{
			 fileKey = `events/eventid_${eventId}/tempid_${existingTempAttendee?.id}/${filename}`;

		}
		
		const command = new PutObjectCommand({
		  Bucket: bucketName,
		  Key: fileKey,
		  ContentType: contentType,
		});
	
		const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		 // Create metadata entry in the database
		 const { output } = await triplitHttpClient.insert('files', {
			uploader_id: user?.id,
			event_id: eventId,
			file_key: fileKey,
			file_type: contentType,
			file_name: filename,
			size_in_bytes: size,
			is_uploaded: false, // Initially marked as not uploaded
		  });
	  
		  return new Response(
			JSON.stringify({
			  uploadURL,
			  fileId: output.id, // Return file ID to reference in the next step
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		  );
		} catch (error) {
		  console.error('Error generating pre-signed URL:', error);
		  return new Response('Internal Server Error', { status: 500 });
		}
	  };


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

		const file = formData.get('file');

		if (!file || !(file instanceof Buffer)) {
			throw new TypeError('No valid file uploaded');
		}

		// Get user-like ID for either user or tempUserAttendee
		const userIdForCurrentUserType = user ? user.id : existingTempAttendee?.id;

		// Extract file from formData
		const filename = formData.get('name');
		const filetype = formData.get('type');
		const fileSize = file.length; // Get the file size in bytes
		const fileStream = Readable.from(file);
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
			const metadata = await sharp(file).metadata();
			h_pixel = metadata.height || null;
			w_pixel = metadata.width || null;

			try {
				// Process the image buffer with sharp
				const processedBuffer = await sharp(file).toFormat('png').toBuffer();
				// Use `getPixels` on the processed buffer
				const pixelData = await getPixels(processedBuffer);
				const data = Uint8ClampedArray.from(pixelData.data);

				// Generate the BlurHash
				blurhash = encode(data, pixelData.width, pixelData.height, 4, 4);
			} catch (e) {
				console.log('failed to generate the blurhash for this image', e);
			}
		} else if (filetype.startsWith('video/')) {
			try {
				// TODO: run extractFirstFrameAndBlurHash in a task and use a default video placeholder while there is no extracted frame. It
				// takes too long to do it synchronously.
				const {
					blurhash: videoBlurHash,
					tempImagePath,
					cleanup: tempCleanup
				} = await extractFirstFrameAndBlurHash(file);

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
		}

		// // Save the fileStream to a local file for debugging
		// const debugFilePath = filename;
		// const writable = fs.createWriteStream(debugFilePath);

		// fileStream.pipe(writable);

		// writable.on('finish', () => {
		// 	console.log(`File saved locally for debugging: ${debugFilePath}`);
		// });

		await uploadLargeFileToS3({
			fileStream,
			key: fileKey,
			contentType: filetype
		});

		// Create database entry
		// TODO: once transactions are supported in HTTP client, add one here
		const fileTx = await triplitHttpClient.insert('files', {
			uploader_id: user?.id ?? null,
			temp_uploader_id: existingTempAttendee?.id ?? null,
			event_id: id,
			file_key: fileKey,
			file_type: filetype,
			file_name: filename,
			size_in_bytes: fileSize,
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
			// Binary file content
			const content = part.slice(contentIndex, part.lastIndexOf('\r\n'));
			formData.set(name, Buffer.from(content, 'binary'));
			formData.set('name', filename);
		} else {
			// Text content
			const content = part.slice(contentIndex, part.lastIndexOf('\r\n')).trim();
			formData.set(name, content);
		}
	}

	return formData;
}
