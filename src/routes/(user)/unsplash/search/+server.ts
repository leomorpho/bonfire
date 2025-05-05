import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import { env as privateEnv } from '$env/dynamic/private';
import { promises as fs } from 'fs';

const unsplash = createApi({
	accessKey: privateEnv.UNSPLASH_ACCESS_KEY,
	fetch: nodeFetch
});

export async function GET({ url }) {
	const query = url.searchParams.get('query');

	if (!query) {
		return new Response(JSON.stringify({ error: 'Query parameter is required' }), { status: 400 });
	}

	const cachedData = await fs.readFile('./cache/plane.json', 'utf-8');
	console.log('Returning cached response');
	return new Response(cachedData, { status: 200 });

	try {
		const result = await unsplash.search.getPhotos({ query });
		if (result.errors) {
			return new Response(JSON.stringify({ error: result.errors }), { status: 500 });
		}
		console.log('response --->', JSON.stringify(result.response));

		return new Response(JSON.stringify(result.response), { status: 200 });
	} catch (error) {
		console.error('failed to search unsplash images', error);
		return new Response(JSON.stringify({ error: 'An error occurred' }), { status: 500 });
	}
}
