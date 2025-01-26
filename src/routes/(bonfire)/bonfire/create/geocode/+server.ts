import { searchLocation } from '$lib/geocoding';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RateLimiter } from 'sveltekit-rate-limiter/server';
import { dev } from '$app/environment';

// // Initialize the rate limiter
// const limiter = new RateLimiter({
// 	IP: [, 'm'], // Limit 30 requests per minute per IP
// 	IPUA: [20, 'm'] // Limit 20 requests per minute per IP + User Agent
// });

export const POST: RequestHandler = async ({ request }) => {
	// Check if the request is limited
	// if (!dev && (await limiter.isLimited({ request }))) {
	// 	throw error(429, 'Too many requests. Please try again later.');
	// }

	try {
		// Parse the JSON body
		const { address } = await request.json();

		if (!address) {
			return new Response(JSON.stringify({ error: 'Address is required.' }), { status: 400 });
		}

		// Perform geocoding
		const results = await searchLocation(address);
		// console.log('===>? res', results);
		if (!results || results.length === 0) {
			return new Response(JSON.stringify({ error: 'No results found for the given address.' }), {
				status: 404
			});
		}

		// Return the geocoded results
		return new Response(JSON.stringify(results), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error in geocoding:', error);
		return new Response(JSON.stringify({ error: 'Failed to process the request.' }), {
			status: 500
		});
	}
};
