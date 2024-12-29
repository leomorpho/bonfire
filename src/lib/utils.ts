import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatHumanReadable(date: Date): string {
	return format(date, "MMMM d, yyyy 'at' h:mma"); // Convert "AM/PM" to "am/pm"
}

/**
 * Converts a JavaScript array into a JSON string representation.
 * @param array - The array to be transformed.
 * @returns A JSON string representation of the array.
 */
export function arrayToStringRepresentation(array: string[] | number[]): string {
	if (!Array.isArray(array)) {
		throw new Error('Input must be an array');
	}

	return JSON.stringify(array);
}

/**
 * Parses a stringified JSON array and returns a list of IDs.
 * @param objectIdsStr - The stringified JSON array of IDs.
 * @returns An array of IDs or an empty array if the input is invalid.
 */
export function stringRepresentationToArray(objectIdsStr: string): string[] {
	try {
		// Parse the JSON string into an array
		const parsed = JSON.parse(objectIdsStr);

		// Ensure the result is an array
		if (Array.isArray(parsed)) {
			return parsed;
		}

		// If it's not an array, return an empty array
		console.warn('Expected a JSON array, but got:', parsed);
		return [];
	} catch (error) {
		// Handle any parsing errors
		console.error('Error parsing object IDs:', error);
		return [];
	}
}

/**
 * Checks if the given parameter is an array and not empty.
 * @param param - The parameter to check.
 * @returns True if the parameter is an array and not empty, otherwise false.
 */
export function isNonEmptyArray(param: unknown): param is unknown[] {
	return Array.isArray(param) && param.length > 0;
}
