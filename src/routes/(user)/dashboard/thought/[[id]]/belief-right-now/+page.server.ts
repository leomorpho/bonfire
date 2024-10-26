import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import {
	setBeliefInThought,
	getThoughtById,
	getBeliefInThought
} from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

const thoughtBeliefRightNowSchema = z.object({
	thoughtId: z.number(),
	beliefRating: z.number().min(0).max(100)
});

export const load = async (event) => {
	const form = await superValidate(zod(thoughtBeliefRightNowSchema));

	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Access the ID parameter from the route
	const thoughtId = Number(event.params.id); // Ensure it's a number

	// Fetch the associated thought from the database
	const thought = await getThoughtById(thoughtId, user.id); // This function should retrieve the thought object by ID
	if (!thought) {
		throw redirect(404, '/not-found'); // Handle not found case
	}

	const beliefInThought = await getBeliefInThought(thoughtId, user.id);
	console.log(beliefInThought);
	return {
		form,
		thought,
		beliefInThought
	};
};

export const actions = {
	next: async ({ request, locals }) => {
		console.log(request);
		const data = await request.formData();
		const form = await superValidate(data, zod(thoughtBeliefRightNowSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		await setBeliefInThought(form.data.thoughtId, form.data.beliefRating, user.id);

		redirect(302, `/dashboard/thought/${form.data.thoughtId}/belief-target`);
	},

	prev: async ({ request, locals }) => {
		console.log(request);
		const data = await request.formData();
		const form = await superValidate(data, zod(thoughtBeliefRightNowSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		await setBeliefInThought(form.data.thoughtId, form.data.beliefRating, user.id);

		redirect(302, `/dashboard/thought/${form.data.thoughtId}/edit`);
	}
};
