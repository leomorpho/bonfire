import { uploadProfileImage } from '$lib/filestorage';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/login'); // Redirect to login if not authenticated
		}

		// Parse the multipart form data (image file)
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file || !(file instanceof File)) {
			return json({ error: 'Invalid file upload' }, { status: 400 });
		}

		// Use the existing upload function
		const key = await uploadProfileImage(file, user.id);

		// Respond with the key
		return json({ key });
	} catch (error) {
		console.error('Error uploading profile image:', error);
		return json({ error: 'Failed to upload profile image' }, { status: 500 });
	}
};
