import NodeGeocoder, { type Options, type Entry } from 'node-geocoder';
import { env } from '$env/dynamic/private';

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
 * Geocodes a user-provided address string into a structured address using fallback logic.
 * @param address - The address input from the user.
 * @returns A Promise resolving to the geocoded address or rejecting with an error.
 */
export async function geocodeAddress(address: string): Promise<Entry[]> {
	try {
		return await geocodeWithFallback(address);
	} catch (error) {
		console.error('Geocoding failed:', error);
		throw new Error('Unable to geocode the address. Please try again.');
	}
}
