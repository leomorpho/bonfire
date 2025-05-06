import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import { env as privateEnv } from '$env/dynamic/private';
// import { promises as fs } from 'fs';

const unsplash = createApi({
	accessKey: privateEnv.UNSPLASH_ACCESS_KEY,
	fetch: nodeFetch
});

export async function GET({ url }) {
	const query = url.searchParams.get('query');
	const countParam = url.searchParams.get('count');
	const pageParam = url.searchParams.get('page');

	// console.log('============> query', query, 'countParam', countParam, 'pageParam', pageParam);
	if (!query) {
		return new Response(JSON.stringify({ error: 'Query parameter is required' }), { status: 400 });
	}

	// const cachedData = await fs.readFile('./cache/plane.json', 'utf-8');
	// console.log('Returning cached response');
	// return new Response(cachedData, { status: 200 });

	// Convert countParam and pageParam to numbers if provided
	const count = countParam ? parseInt(countParam, 10) : undefined;
	const page = pageParam ? parseInt(pageParam, 10) : 1;

	try {
		const params = { query, per_page: 3 };
		if (count) {
			params.perPage = count;
		}
		if (page) {
			params.page = page;
		}

		const result = await unsplash.search.getPhotos(params);

		if (result.errors) {
			return new Response(JSON.stringify({ error: result.errors }), { status: 500 });
		}

		return new Response(JSON.stringify(result.response), { status: 200 });
	} catch (error) {
		console.error('failed to search unsplash images', error);
		return new Response(JSON.stringify({ error: 'An error occurred' }), { status: 500 });
	}
}
