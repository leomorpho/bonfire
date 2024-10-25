import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import {
	createThought,
	setBeliefInThought,
	linkCognitiveDistortion
} from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

// Step 1: Define your form schemas
const thoughtSchema = z.object({
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
	return { thoughtForm };
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
