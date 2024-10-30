import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { env } from '$env/dynamic/private';
import { ChatOpenAI } from '@langchain/openai';
import { CognitiveDistortions, distortionDetails } from './enums';

// Set up OpenAI model configuration
const openai = new ChatOpenAI({
	openAIApiKey: env.OPENAI_API_KEY,
	modelName: 'gpt-4o-mini' // or "gpt-4" if you have access
});

const cognitiveDistortionsPrompt = new PromptTemplate({
	inputVariables: ['thoughtText'],
	template: `You are a cognitive behavioral therapist. Analyze the following thought for **all cognitive distortions that may apply**. Identify any distortions with at least partial relevance, and provide a non-zero rating even for subtle signs of a distortion. 

Return the response as a JSON object with only the distortions that have a rating greater than 0. The JSON structure should look like this:
    {{
      "ALL_OR_NOTHING": {{ "rating": 100, "details": "Brief explanation if present" }},
      "OVERGENERALIZATION": {{ "rating": 0, "details": "" }},
      "MENTAL_FILTER": {{ "rating": 0, "details": "" }},
      "DISCOUNTING_POSITIVES": {{ "rating": 0, "details": "" }},
      "JUMPING_TO_CONCLUSIONS": {{ "rating": 0, "details": "" }},
      "MAGNIFICATION": {{ "rating": 0, "details": "" }},
      "EMOTIONAL_REASONING": {{ "rating": 0, "details": "" }},
      "SHOULD_STATEMENTS": {{ "rating": 0, "details": "" }},
      "LABELING": {{ "rating": 0, "details": "" }},
      "PERSONALIZATION": {{ "rating": 0, "details": "" }}
    }}
      
Consider these common cognitive distortions:
- **All-or-Nothing Thinking**: Viewing situations in black-or-white terms, without considering the spectrum in between.
- **Overgeneralization**: Taking one instance or outcome and applying it broadly.
- **Mental Filter**: Focusing only on the negative and ignoring positive aspects.
- **Discounting Positives**: Rejecting positive aspects or accomplishments.
- **Jumping to Conclusions**: Making assumptions or predictions with little or no evidence.
- **Magnification (or Minimization)**: Amplifying negatives or minimizing positives.
- **Emotional Reasoning**: Believing that feelings reflect objective reality.
- **Should Statements**: Having rigid rules about how oneself or others should behave.
- **Labeling**: Assigning broad, unchangeable labels based on specific actions.
- **Personalization**: Attributing external events to oneself without justification.

Analyze carefully and rate each distortion you identify on a scale of 0-100.
`
});

const cognitiveDistortionChain = new LLMChain({
	llm: openai,
	prompt: cognitiveDistortionsPrompt
});

export async function detectCognitiveDistortions(thoughtText: string) {
	const response = await cognitiveDistortionChain.call({
		thoughtText
	});
	// TODO: don't remove, and set env var to turn off access to AI API for testing
	// const response = {
	// 	text:
	// 		'```json\n' +
	// 		'{\n' +
	// 		'  "ALL_OR_NOTHING": { "rating": 75, "details": "The thought reflects an extreme perspective, suggesting that if things are not perfect, they are seen as a failure." },\n' +
	// 		'  "OVERGENERALIZATION": { "rating": 50, "details": "The thought may take a specific instance of disappointment and suggest that future outcomes will always be the same." },\n' +
	// 		'  "JUMPING_TO_CONCLUSIONS": { "rating": 40, "details": "There may be an assumption made about the outcome of a situation without adequate evidence." },\n' +
	// 		'  "EMOTIONAL_REASONING": { "rating": 30, "details": "The thought blurs the line between feelings and facts, leading to a belief that negative feelings indicate negative realities." }\n' +
	// 		'}\n' +
	// 		'```'
	// };

	// Clean up and parse the JSON response
	const cleanedJson = cleanUpMangledJson(response.text);
	try {
		const parsedRatings = JSON.parse(cleanedJson);

		// Complete the ratings by ensuring all distortions are included
		const existingDistortions = transformDistortionsToList(parsedRatings);

		// Map distortions to initialize or set rating based on existing data
		const distortionRatings = Object.entries(CognitiveDistortions).map(([enumName, distortion]) => {
			const existing = existingDistortions.find(
				(d) => d.cognitiveDistortion === distortion && d.source === 'ai'
			);

			return {
				name: distortion, // Display name (e.g., "All or Nothing")
				rating: existing ? [existing.rating] : [0], // Use existing rating or default to 50
				enumName: enumName, // Enum name in uppercase (e.g., "ALL_OR_NOTHING")
				details: existing ? existing.details : '',
				...distortionDetails[distortion] // Additional details from `distortionDetails`
			};
		});

		console.log("=========== A.I. ============")
		console.log(distortionRatings);

		return distortionRatings;
	} catch (error) {
		console.error('Failed to parse JSON:', error);
		return null; // Handle this as appropriate in your application
	}
}

// Helper function to clean up the JSON string
function cleanUpMangledJson(jsonString: string): string {
	return jsonString
		.replace(/```json/g, '') // Remove code block markers
		.replace(/```/g, '')
		.replace(/\\n/g, '') // Remove line break escape characters
		.replace(/\s*`\s*/g, '') // Remove stray backticks
		.trim(); // Remove leading/trailing whitespace
}

// Convert Cognitive Distortions Enum to Map
function transformDistortionsToList(
	partialRatings: Record<string, { rating: number; details: string }>
) {
	return Object.entries(CognitiveDistortions).map(([enumName, displayName]) => {
		const distortion = partialRatings[enumName] || { rating: 0, details: '' };

		return {
			cognitiveDistortion: displayName, // Display name (e.g., "All or Nothing")
			rating: distortion.rating,
			source: 'ai',
			details: distortion.details
		};
	});
}
