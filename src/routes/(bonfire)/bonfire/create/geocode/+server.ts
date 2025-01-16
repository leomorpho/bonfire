import { geocodeAddress } from '$lib/geocoding';
import type { RequestHandler } from './$types';


export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse the JSON body
    const { address } = await request.json();

    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required.' }), { status: 400 });
    }

    // Perform geocoding
    const results = await geocodeAddress(address);

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'No results found for the given address.' }), { status: 404 });
    }

    // Return the geocoded results
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in geocoding:', error);
    return new Response(JSON.stringify({ error: 'Failed to process the request.' }), { status: 500 });
  }
};
