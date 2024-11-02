import { fail, redirect, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import {
	upsertBeliefTargetRating,
	getThoughtById,
	getBeliefTargetRating
} from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

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
		user,
        salt: user.salt,
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const form = await superValidate(data, zod(saltSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Redirect to the provided URL after saving
		throw redirect(302, '/dashboard/');
	}
} satisfies Actions;
