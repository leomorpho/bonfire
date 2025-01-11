import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { generateId } from 'lucia';
import { tempAttendeeIdStore, tempAttendeeIdUrlParam } from './enums';
import { get } from 'svelte/store';

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

export function loadScript(src: string) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script');
		script.src = src;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
		document.head.appendChild(script);
	});
}

export const loadPassphraseScript = () => {
	return new Promise((resolve, reject) => {
		if (window.Passphrase) {
			// Passphrase is already available
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://unpkg.com/@root/passphrase';
		script.async = true;
		script.onload = () => {
			if (window.Passphrase) {
				resolve();
			} else {
				reject(new Error('Passphrase script loaded but not available.'));
			}
		};
		script.onerror = () => reject(new Error('Failed to load Passphrase script.'));
		document.head.appendChild(script);
	});
};

export const generatePassphraseId = async (prefix: string | null = null) => {
	try {
		// Ensure the Passphrase script is loaded
		await loadPassphraseScript();

		const Passphrase = window.Passphrase;

		// Generate passphrase
		const passphrase = await Passphrase.generate(24);

		// Split passphrase into words and join with '-'
		const passphrasePart = passphrase.split(' ').join('-');

		// Generate random ID
		const randomId = generateId(7);

		// Combine passphrase and random ID
		let combined = `${passphrasePart}-${randomId}`;

		if (prefix) {
			combined = `${prefix}-${combined}`;
		}
		return combined;
	} catch (error) {
		console.error('Error generating event ID:', error);

		// Return fallback value...just a regular crypto generated value
		return generateId(20);
	}
};

export const adaptForTempUserUrl = (url: string) => {
	const tempAttendeeId = get(tempAttendeeIdStore);

	if (!tempAttendeeId) {
		return url;
	}

	const param = `${tempAttendeeIdUrlParam}=${encodeURIComponent(tempAttendeeId)}`;

	if (url.includes('?')) {
		// URL already has parameters
		return url.endsWith('&') || url.endsWith('?') ? `${url}${param}` : `${url}&${param}`;
	} else {
		// URL has no parameters
		return `${url}?${param}`;
	}
};
