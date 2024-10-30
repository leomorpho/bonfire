import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { detectCognitiveDistortions } from '$lib/ai';
import { linkCognitiveDistortionsBulk } from '$lib/server/database/thought.model';
import type { CognitiveDistortions } from '$lib/enums';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { thought } = await request.json();

		// Get the user from locals
		const user = locals.user;
		if (!user) {
			throw redirect(302, '/login'); // Redirect to login if not authenticated
		}

		// Pass the thought text to the AI detection function
		const distortionRatings = await detectCognitiveDistortions(thought.text);

		if (!distortionRatings) {
			return json({ error: 'No distortions detected' }, { status: 400 });
		}

		// Map distortionRatings to match the expected structure
		const formattedDistortions = distortionRatings.map((item) => ({
			distortion: item.enumName as keyof typeof CognitiveDistortions,
			rating: item.rating[0], // Assuming the first element is the desired rating
			source: 'ai' as 'user' | 'ai',
			details: item.details
		}));
		console.log(formattedDistortions);
		console.log(thought.id);
		console.log(user.id);
		await linkCognitiveDistortionsBulk(thought.id, formattedDistortions, user.id);

		return json({ distortionRatings });
	} catch (error) {
		console.error('Error detecting cognitive distortions:', error);
		return json({ error: 'Failed to detect cognitive distortions' }, { status: 500 });
	}
};
