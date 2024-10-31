import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { getThoughtById, setThoughtEmotions } from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from '../$types';

const emotionsSchema = z.object({
	thoughtId: z.number(),
	selectedEmotions: z.array(z.string()).optional() // Optional array for selected emotions
});

export const load = async (event) => {
	const form = await superValidate(zod(emotionsSchema));

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

	return {
		form,
		thought
	};
};

// Shared function to handle form logic for belief target rating
async function saveAnalysis(
	request: { formData: () => any },
	locals: { user: any },
	redirectPathParam: string
) {
	const data = await request.formData();
	const thoughtId = Number(data.get('thoughtId'));

	// // Collect checkbox values into an array
	// const selectedEmotions = [];
	// for (const key of data.keys()) {
	// 	// Only add checkbox items with true values (which will be the name of each emotion)
	// 	if (key !== 'thoughtId' && key !== '__superform_id') {
	// 		selectedEmotions.push(key);
	// 	}
	// }

	// const formInput = {
	// 	thoughtId,
	// 	selectedEmotions
	// };

	// // Validate the form input using the schema
	// const form = await superValidate(formInput, zod(emotionsSchema));

	// if (!form.valid) {
	// 	return fail(400, { form });
	// }
	// const user = locals.user;
	// if (!user) {
	// 	return fail(401, { error: 'Unauthorized' });
	// }

	// await setThoughtEmotions(
	// 	user.id,
	// 	form.data.thoughtId,
	// 	form.data.selectedEmotions ? form.data.selectedEmotions : []
	// );
	throw redirect(302, `/dashboard/thought/${thoughtId}/${redirectPathParam}`);
}

export const actions = {
	save: async ({ request, locals }) => {
		await saveAnalysis(request, locals, 'work');
	},
	prev: async ({ request, locals }) => {
		await saveAnalysis(request, locals, 'emotions/selection');
	}
} satisfies Actions;
