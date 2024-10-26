import { CognitiveDistortions } from '$lib/enums';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { getThoughtById, linkCognitiveDistortionsBulk } from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';
import { thoughtDistortionTable } from '$lib/server/database/schema';
import { db } from '$lib/server/database/db';
import { eq } from 'drizzle-orm';

const thoughtBeliefTargetSchema = z.object({
	thoughtId: z.number(),
	cognitiveDistortions: z.array(
		z.object({
			distortion: z.enum(Object.keys(CognitiveDistortions) as [keyof typeof CognitiveDistortions]),
			rating: z.number().min(0).max(100),
			source: z.enum(['user', 'ai'])
		})
	)
});

export const load = async (event) => {
	const form = await superValidate(zod(thoughtBeliefTargetSchema));
	const user = event.locals.user;

	if (!user) {
		throw redirect(302, '/login');
	}

	const thoughtId = Number(event.params.id);
	const thought = await getThoughtById(thoughtId, user.id);

	if (!thought) {
		throw redirect(404, '/not-found');
	}

	// Initialize each cognitive distortion with a default rating of 50
	const distortionRatings = Object.values(CognitiveDistortions).map((distortion) => ({
		name: distortion,
		rating: [50]
	}));

	return {
		form,
		thought,
		distortionRatings // Send to the frontend for rendering
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const form = await superValidate(data, zod(thoughtBeliefTargetSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const { thoughtId, cognitiveDistortions } = form.data;

		// Link cognitive distortions in bulk
		if (cognitiveDistortions) {
			await linkCognitiveDistortionsBulk(thoughtId, cognitiveDistortions, user.id);
		}

		redirect(302, `/dashboard/thought/${thoughtId}/distortions`);
	}
};
