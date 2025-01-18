import { uploadBannerImage } from '$lib/filestorage';
import { error, json, redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	const { id: eventId } = params;

	if (!eventId) {
		throw error(400, 'Missing ID parameter'); // Return 400 if `id` is not provided
	}

	try {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/login'); // Redirect to login if not authenticated
		}

		// Parse the multipart form data (image file)
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file || !(file instanceof File)) {
			throw new TypeError('No valid file uploaded');
		}

		// Use the existing upload function
		const { largeImageKey, smallImageKey } = await uploadBannerImage(file, user.id, eventId);

		// Respond with the key
		return json({ largeImageKey, smallImageKey });
	} catch (error) {
		console.error('Error uploading banner media:', error);
		return json({ error: 'Failed to upload banner media' }, { status: 500 });
	}
};
