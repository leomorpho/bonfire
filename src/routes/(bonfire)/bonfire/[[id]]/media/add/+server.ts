import { uploadLargeFileToS3 } from '$lib/images';
import type { RequestEvent } from '@sveltejs/kit';
import { Readable } from 'stream';
import { error } from '@sveltejs/kit';

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
		const metadata = formData.get('metadata'); // Optional additional metadata

		if (!file || !(file instanceof Buffer)) {
			throw new TypeError('No valid file uploaded');
		}

		const fileStream = Readable.from(file);

		const fileKey = `events/eventid_${id}/userid_${user.id}/${Date.now()}_${metadata?.name || 'file'}`;
		const contentTypeHeader = metadata?.type || 'application/octet-stream';

		await uploadLargeFileToS3({
			fileStream,
			key: fileKey,
			contentType: contentTypeHeader,
		});

		return new Response(
			JSON.stringify({ message: 'File uploaded successfully', fileKey }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		console.error('Error uploading file:', error);
		return new Response('Internal Server Error', { status: 500 });
	}
};

// Utility function to parse multipart form data
async function parseMultipart(request: Request, boundary: string) {
	const buffer = await request.arrayBuffer();
	const data = Buffer.from(buffer); // Use Buffer for binary-safe handling
	const parts = data.toString('utf-8').split(`--${boundary}`);
	const formData = new Map<string, any>();

	for (const part of parts) {
		const match = part.match(
			/Content-Disposition: form-data; name="([^"]+)"(; filename="([^"]+)")?/
		);
		if (!match) continue;

		const name = match[1];
		const filename = match[3];
		const contentIndex = part.indexOf('\r\n\r\n') + 4;

		if (filename) {
			// Extract the binary file content as a Buffer
			const content = part.slice(contentIndex, part.lastIndexOf('\r\n--'));
			formData.set(name, Buffer.from(content, 'binary'));
		} else {
			// Extract text content
			const content = part.slice(contentIndex, part.length - 2).trim();
			formData.set(name, content);
		}
	}

	return formData;
}
