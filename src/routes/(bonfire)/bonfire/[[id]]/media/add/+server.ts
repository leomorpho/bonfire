import { uploadLargeFileToS3 } from '$lib/filestorage';
import type { RequestEvent } from '@sveltejs/kit';
import { Readable } from 'stream';
import { error } from '@sveltejs/kit';
import { serverTriplitClient } from '$lib/server/triplit';
import sharp from 'sharp';
import type { TriplitClient } from '@triplit/client';
import { createNewFileNotificationQueueObject } from '$lib/notification';

export const POST = async (event: RequestEvent): Promise<Response> => {
	try {
		const user = event.locals.user;
		if (!user || !user.id) {
			throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
		}

		const { id } = event.params;

		if (!id) {
			throw error(400, 'Missing ID parameter'); // Return 400 if `id` is not provided
		}

		const contentType = event.request.headers.get('content-type') || '';
		const boundaryMatch = contentType.match(/boundary=(.+)$/);

		if (!boundaryMatch) {
			return new Response('Invalid multipart form', { status: 400 });
		}

		const boundary = boundaryMatch[1];
		const formData = await parseMultipart(event.request, boundary);

		const file = formData.get('file');

		if (!file || !(file instanceof Buffer)) {
			throw new TypeError('No valid file uploaded');
		}

		// Extract file from formData
		const filename = formData.get('name');
		const filetype = formData.get('type');
		const fileSize = file.length; // Get the file size in bytes
		const fileStream = Readable.from(file);
		const fileKey = `events/eventid_${id}/userid_${user.id}/${filename}`;

		// Initialize metadata
		let h_pixel: number | null = null;
		let w_pixel: number | null = null;

		// Extract dimensions if applicable
		if (filetype.startsWith('image/')) {
			// Images: Use `sharp`
			const metadata = await sharp(file).metadata();
			h_pixel = metadata.height || null;
			w_pixel = metadata.width || null;
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

		// Create entry
		const fileTx = await serverTriplitClient.insert('files', {
			uploader_id: user.id,
			event_id: id,
			file_key: fileKey,
			file_type: filetype,
			file_name: filename,
			size_in_bytes: fileSize,
			h_pixel: h_pixel,
			w_pixel: w_pixel
		});

		await createNewFileNotificationQueueObject(serverTriplitClient as TriplitClient, user.id, id, [
			fileTx?.output?.id as string
		]);

		return new Response(JSON.stringify({ message: 'File uploaded successfully', fileKey }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
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
