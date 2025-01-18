import NodeGeocoder, { type Options, type Entry } from 'node-geocoder';
import { env } from '$env/dynamic/private';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

// List of geocoder options for multiple providers
const providers: Options[] = [
	// {
	// 	provider: 'here',
	// 	appId: env.HERE_GEOCODING_APP_ID,
	// 	apiKey: env.HERE_GEOCODING_APP_KEY,
	// 	formatter: null // Optional
	// },
	{
		provider: 'google',
		apiKey: env.GOOGLE_GEOCODING_API_KEY,
		formatter: null // Optional: Choose a formatter or leave null
	}
];

// Utility function to try multiple providers
async function geocodeWithFallback(
	address: string
): Promise<{ success: boolean; results?: Entry[]; error?: string }> {
	if (!address) {
		return { success: false, error: 'Address is required.' };
	}

	// Iterate over providers and attempt geocoding
	for (const options of providers) {
		try {
			const geocoder = NodeGeocoder(options);
			const results = await geocoder.geocode(address);
			return { success: true, results };
		} catch (error) {
			console.error(`Provider ${options.provider} failed:`, error);
		}
	}

	// If all providers fail or no results are found
	return {
		success: false,
		error: 'No results found. Please provide a more complete address or check your input.'
	};
}

/**
 * Searches for places using the Google Places API.
 * @param query - Search query, e.g., "Burger King New Crescent Street".
 * @returns A Promise resolving to place details.
 */
async function searchPlaces(query: string) {
	if (!query) {
		throw new Error('Query is required.');
	}

	try {
		// Use the Places Text Search API
		const response = await client.textSearch({
			params: {
				query, // User-provided query
				key: env.GOOGLE_GEOCODING_API_KEY as string
			}
		});

		const data = response.data;
		if (data.status !== 'OK') {
			throw new Error(`Places API Error: ${data.status}`);
		}

		// Extract and map useful fields
		const structuredResults = data.results.map((place) => ({
			name: place.name,
			address: place.formatted_address,
			latitude: place.geometry.location.lat,
			longitude: place.geometry.location.lng,
			place_id: place.place_id,
			icon: place.icon, // URL to the place's icon
			rating: place.rating || null, // Average rating
			user_ratings_total: place.user_ratings_total || 0, // Total number of ratings
			types: place.types, // Categories/types of the place
			photo: place.photos?.[0]?.photo_reference || null // Reference to the photo if available
		}));

		return structuredResults;
	} catch (error) {
		console.error('Error searching places:', error);
		throw error;
	}
}

/**
 * Determine if the query is a structured address or a POI.
 * @param query - The input query.
 * @returns 'geocode' or 'places' depending on the query type.
 */
function determineQueryType(query: string): 'geocode' | 'places' {
	const structuredAddressPattern = /\d+|st|rd|ave|blvd|street|road|avenue|zip|postal/i;
	const poiKeywords = /near|closest to|restaurant|hotel|store|tower|mall|bar/i;

	if (poiKeywords.test(query)) {
		return 'places';
	}

	if (structuredAddressPattern.test(query)) {
		return 'geocode';
	}

	// Default to 'places' if unsure
	return 'places';
}

/**
 * Perform geocoding or POI search based on the query type.
 * @param query - The user input.
 * @returns The search results.
 */
export async function searchLocation(query: string) {
	const queryType = determineQueryType(query);

	try {
		if (queryType === 'geocode') {
			const geocodeResponse = await geocodeWithFallback(query);

			return {
				type: 'geocode',
				results: geocodeResponse.results || [],
				success: geocodeResponse.success,
				error: geocodeResponse.error
			};
		} else {
			console.log('Using Places API...');
			const placesResponse = await searchPlaces(query);

			return {
				type: 'places',
				results: placesResponse || [],
				success: true
			};
		}
	} catch (error) {
		console.error('Error in searchLocation:', error);
		return {
			type: queryType,
			results: [],
			success: false,
			error: 'Failed to process the query.'
		};
	}
}
