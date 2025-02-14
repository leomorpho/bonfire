import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday } from 'date-fns';
import { generateId } from 'lucia';
import { tempAttendeeSecretStore, tempAttendeeSecretParam } from './enums';
import { get } from 'svelte/store';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatHumanReadable(date: Date | null): string {
	if (!date) {
		return '';
	}
	return format(date, "MMMM d, yyyy 'at' h:mma"); // Convert "AM/PM" to "am/pm"
}

export function formatHumanReadableHour(date: Date): string {
	return format(date, 'h:mma'); // Convert "AM/PM" to "am/pm"
}

export function formatHumanReadableWithContext(date: Date): string {
	if (isToday(date)) {
		return format(date, 'h:mm a'); // Today: "2:30 PM"
	}

	if (isYesterday(date)) {
		return `Yesterday ${format(date, 'h:mm a')}`; // Yesterday: "Yesterday 2:30 PM"
	}

	// If the date is older, show "Month Day, h:mm a" (e.g., "March 5, 2:30 PM")
	const formatString =
		date.getFullYear() === new Date().getFullYear()
			? 'MMMM d, h:mm a' // This year: "March 5, 2:30 PM"
			: 'MMMM d, yyyy, h:mm a'; // Previous years: "March 5, 2023, 2:30 PM"

	return format(date, formatString);
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

export const generatePassphraseId = async (prefix: string | null = null, wordsLen: number = 24) => {
	try {
		// Ensure the Passphrase script is loaded
		await loadPassphraseScript();

		const Passphrase = window.Passphrase;

		// Generate passphrase
		const passphrase = await Passphrase.generate(wordsLen);

		// Split passphrase into words and join with '-'
		const passphrasePart = passphrase.split(' ').join('-');

		// Generate random ID
		const randomId = generateId(4);

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
	const tempAttendeeId = get(tempAttendeeSecretStore);

	if (!tempAttendeeId) {
		return url;
	}

	const param = `${tempAttendeeSecretParam}=${encodeURIComponent(tempAttendeeId)}`;

	if (url.includes('?')) {
		// URL already has parameters
		return url.endsWith('&') || url.endsWith('?') ? `${url}${param}` : `${url}&${param}`;
	} else {
		// URL has no parameters
		return `${url}?${param}`;
	}
};

export const setTempAttendeeIdParam = () => {
	// Retrieve the tempAttendeeId value
	const tempAttendeeId = tempAttendeeSecretStore.get();

	if (tempAttendeeId) {
		const observer = new MutationObserver(() => {
			// Modify all <a> links on the page
			const links = document.querySelectorAll<HTMLAnchorElement>('a');
			links.forEach((link) => {
				const url = new URL(link.href, window.location.origin);

				// Check if the link is internal and doesn't already have the parameter
				if (
					url.origin === window.location.origin &&
					!url.searchParams.has(tempAttendeeSecretParam)
				) {
					url.searchParams.set(tempAttendeeSecretParam, tempAttendeeId);
					link.href = url.toString(); // Update the href attribute
				}
			});
		});

		// Observe the entire document for DOM changes
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		// Cleanup when the component is destroyed
		return () => observer.disconnect();
	}
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const debounce = (func, delay = 300) => {
	let timeoutId;

	return function (...args) {
		// Clear the previous timeout
		clearTimeout(timeoutId);

		// Set a new timeout to call the function after the delay
		return new Promise((resolve, reject) => {
			timeoutId = setTimeout(async () => {
				try {
					const result = await func(...args);
					resolve(result);
				} catch (error) {
					reject(error);
				}
			}, delay);
		});
	};
};

export function detectTailwindTheme(): 'light' | 'dark' {
	if (typeof window !== 'undefined') {
		return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	}
	return 'light';
}

export const createAttendeeId = (eventId: string, userId: string) => {
	return eventId + '-' + userId;
};

export const isMobile = () => {
	return typeof window !== 'undefined' && 'ontouchstart' in window;
};
