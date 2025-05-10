import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
	apiKey: process.env['MISTRAL_API_KEY'] ?? ''
});

export const getTopicWords = async (text: string) => {
	const inputText = `For the following text: ${text} what's the general topic? Answer in 1-2 words`;

	const result = await mistral.chat.complete({
		model: 'mistral-small-latest',
		messages: [
			{
				content: inputText,
				role: 'user'
			}
		]
	});

	return result;
};
