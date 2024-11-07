import { fail, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { setEncryptionBackupStatus } from '$lib/server/database/user.model.js';
import { redirect } from 'sveltekit-flash-message/server'

const saltSchema = z.object({
	salt: z.string()
});

export const load = async (event) => {
	const form = await superValidate(zod(saltSchema));

	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	return {
		form,
		user
	};
};

export const actions = {
	default: async ({ request, locals, cookies }) => {
		const data = await request.formData();
		const form = await superValidate(data, zod(saltSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		await setEncryptionBackupStatus(user.id, true)
		
		// Redirect to the provided URL after saving
		throw redirect('/dashboard/', { type: 'success', message: "Decryption successful!" }, cookies);
	}
} satisfies Actions;
