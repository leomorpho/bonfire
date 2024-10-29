import { json, type RequestHandler } from '@sveltejs/kit';
import { detectCognitiveDistortions } from '$lib/ai';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { thought } = await request.json();

		// Pass the thought text to the AI detection function
		const distortionRatings = await detectCognitiveDistortions(thought.text);

		return json({ distortionRatings });
	} catch (error) {
		console.error('Error detecting cognitive distortions:', error);
		return json({ error: 'Failed to detect cognitive distortions' }, { status: 500 });
	}
};
