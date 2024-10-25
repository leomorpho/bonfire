import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { createThought } from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

// Step 1: Define your form schemas
const thoughtSchema = z.object({
	thought: z.string().min(1, 'Thought cannot be empty')
});

// Step 2: Implement the form load function
export const load = async (event) => {
	const thoughtForm = await superValidate(zod(thoughtSchema));

	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	return {
		thoughtForm
	};
};

// Step 3: Handle the form actions
export const actions = {
	createThought: async ({ request, locals }) => {
		const data = await request.formData();
		const thoughtForm = await superValidate(data, zod(thoughtSchema));

		if (!thoughtForm.valid) {
			return fail(400, { thoughtForm });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const newThought = await createThought(user.id, thoughtForm.data.thought);

		return { thoughtForm, newThought };
	}
};
