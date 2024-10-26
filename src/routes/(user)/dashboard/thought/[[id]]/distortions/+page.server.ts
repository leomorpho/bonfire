import { CognitiveDistortions, distortionDetails } from '$lib/enums';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import {
	getCognitiveDistortionsForThought,
	getThoughtById,
	linkCognitiveDistortionsBulk
} from '$lib/server/database/thought.model';
import { zod } from 'sveltekit-superforms/adapters';

const thoughtBeliefTargetSchema = z.object({
	thoughtId: z.number(),
	ALL_OR_NOTHING: z.number().min(0).max(100).default(50),
	OVERGENERALIZATION: z.number().min(0).max(100).default(50),
	MENTAL_FILTER: z.number().min(0).max(100).default(50),
	DISCOUNTING_POSITIVES: z.number().min(0).max(100).default(50),
	JUMPING_TO_CONCLUSIONS: z.number().min(0).max(100).default(50),
	MAGNIFICATION: z.number().min(0).max(100).default(50),
	EMOTIONAL_REASONING: z.number().min(0).max(100).default(50),
	SHOULD_STATEMENTS: z.number().min(0).max(100).default(50),
	LABELING: z.number().min(0).max(100).default(50),
	PERSONALIZATION: z.number().min(0).max(100).default(50)
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

	const existingDistortions = await getCognitiveDistortionsForThought(thoughtId, user.id);

	// Map distortions to initialize or set rating based on existing data
	const distortionRatings = Object.entries(CognitiveDistortions).map(([enumName, distortion]) => {
		const existing = existingDistortions.find(
			(d) => d.cognitiveDistortion === distortion && d.source === 'user'
		);

		return {
			name: distortion, // Display name (e.g., "All or Nothing")
			rating: existing ? [existing.rating] : [0], // Use existing rating or default to 50
			enumName: enumName, // Enum name in uppercase (e.g., "ALL_OR_NOTHING")
			...distortionDetails[distortion] // Additional details from `distortionDetails`
		};
	});

	return {
		form,
		thought,
		distortionRatings
	};
};

// Shared function to handle form logic for belief target rating
async function handleDistortions(
	request: { formData: () => any },
	locals: { user: any },
	redirectPathParam: string
) {
	const data = await request.formData();
	const form = await superValidate(data, zod(thoughtBeliefTargetSchema));

	if (!form.valid) {
		return fail(400, { form });
	}

	const user = locals.user;
	if (!user) {
		return fail(401, { error: 'Unauthorized' });
	}


	// Extract thoughtId and cognitive distortions from form data
	const { thoughtId } = form.data;
	const cognitiveDistortionsArray = Object.entries(form.data)
		.filter(([key]) => key !== 'thoughtId') // Exclude thoughtId from mapping
		.map(([distortion, rating]) => ({
			distortion: distortion as keyof typeof CognitiveDistortions, // Enum name
			rating: Number(rating), // Rating (either default 50 or user-set)
			source: 'user' as 'user' | 'ai' // Explicitly type source as 'user'
		}));

	// Link cognitive distortions in bulk
	if (cognitiveDistortionsArray.length > 0) {
		await linkCognitiveDistortionsBulk(thoughtId, cognitiveDistortionsArray, user.id);
	}

	throw redirect(302, `/dashboard/thought/${thoughtId}/${redirectPathParam}`);
}

export const actions = {
	next: async ({ request, locals }) => {
		return handleDistortions(request, locals, 'distortions');
	},

	prev: async ({ request, locals }) => {
		return handleDistortions(request, locals, 'belief-target');
	}
} satisfies Actions;
