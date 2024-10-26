import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { getThoughtById, updateThought } from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

// Step 1: Define your form schemas
const thoughtSchema = z.object({
	thoughtId: z.number(),
	thought: z.string().min(1, 'Thought cannot be empty')
});

// Step 2: Implement the form load function
export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	const thoughtId = Number(event.params.id);
	console.log(thoughtId);
	const thought = await getThoughtById(thoughtId, user.id);

	const thoughtForm = await superValidate(thought, zod(thoughtSchema));

	return {
		thoughtForm,
		thoughtId
	};
};

// Step 3: Handle the form actions
export const actions = {
	next: async ({ request, locals }) => {
		const data = await request.formData();
		const thoughtForm = await superValidate(data, zod(thoughtSchema));

		if (!thoughtForm.valid) {
			return fail(400, { thoughtForm });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const newThought = await updateThought(user.id,thoughtForm.data.thoughtId, thoughtForm.data.thought);

		redirect(302, `/dashboard/thought/${newThought.id}/belief-right-now`);
	},
	prev: async ({ request, locals }) => {
		const data = await request.formData();
		const thoughtForm = await superValidate(data, zod(thoughtSchema));

		if (!thoughtForm.valid) {
			return fail(400, { thoughtForm });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const newThought = await updateThought(user.id,thoughtForm.data.thoughtId, thoughtForm.data.thought);

		redirect(302, '/dashboard');
	}
};
