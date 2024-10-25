import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import {
	createThought,
	setBeliefInThought,
	linkCognitiveDistortion,
    updateThought,
    deleteThought,
    listThoughts
} from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

// Step 1: Define your form schemas
const thoughtSchema = z.object({
	thought: z.string().min(1, 'Thought cannot be empty')
});

const thoughtUpdateSchema = z.object({
    thoughtId: z.number(),
	thought: z.string().min(1, 'Thought cannot be empty')
});

const beliefSchema = z.object({
	thoughtId: z.number(),
	beliefRating: z.number().min(0).max(100)
});

const distortionSchema = z.object({
	thoughtId: z.number(),
	cognitiveDistortionId: z.number(),
	rating: z.number().min(0).max(100),
	source: z.enum(['user', 'ai'])
});

// Step 2: Implement the form load function
export const load = async (event) => {
	const thoughtForm = await superValidate(zod(thoughtSchema));
	
    // Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	// Fetch the user's thoughts from the database
	const thoughts = await listThoughts(user.id);

	return {
		thoughtForm,
		thoughts // Pass thoughts to the frontend
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

		const thoughtId = await createThought(user.id, thoughtForm.data.thought);

		return { thoughtForm };
	},

    updateThought: async ({ request, locals }) => {
		const data = await request.formData();
		const thoughtForm = await superValidate(data, zod(thoughtUpdateSchema));

		if (!thoughtForm.valid) {
			return fail(400, { thoughtForm });
		}

		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}


		try {
			await updateThought(user.id, thoughtForm.data.thoughtId, thoughtForm.data.thought);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to update the thought' });
		}
	},

    deleteThought: async ({ request, locals }) => {
		const data = await request.formData();
		const thoughtId = Number(data.get('thoughtId')); // Assuming 'thoughtId' is passed as form data

		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			await deleteThought(user.id, thoughtId);
			return { success: true };
		} catch (error) {
			return fail(500, { error: 'Failed to delete the thought' });
		}
	},

	setBelief: async ({ request, locals }) => {
		const data = await request.formData();
		const beliefForm = await superValidate(data, zod(beliefSchema));

		if (!beliefForm.valid) {
			return fail(400, { beliefForm });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		await setBeliefInThought(beliefForm.data.thoughtId, beliefForm.data.beliefRating, user.id);

		return { success: true };
	},

	linkDistortions: async ({ request, locals }) => {
		const data = await request.formData();
		const distortionForm = await superValidate(data, zod(distortionSchema));

		if (!distortionForm.valid) {
			return fail(400, { distortionForm });
		}
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		// Link the distortion to the thought
		await linkCognitiveDistortion(
			distortionForm.data.thoughtId,
			distortionForm.data.cognitiveDistortionId,
			distortionForm.data.rating,
			distortionForm.data.source,
			user.id
		);

		return { success: true };
	}
};
