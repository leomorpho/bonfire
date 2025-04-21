import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isBefore, isToday, isYesterday } from 'date-fns';
import { generateId } from 'lucia';
import { tempAttendeeSecretStore, tempAttendeeSecretParam } from './enums';
import { get } from 'svelte/store';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatHumanReadable(date: Date | null | undefined): string {
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

export const generatePassphraseId = async (prefix: string | null = null, wordsLen: number = 8) => {
	if (prefix) {
		return prefix + '_' + generateId(wordsLen);
	}
	return generateId(wordsLen);
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

export const isMobile = () => {
	// Ensure we are in the browser to avoid SSR issues
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}

	// Check for touch device
	return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
};

export const setTempAttendeeInfoInLocalstorage = async (
	bonfireId: string,
	tempAttendeeSecret: string | null
) => {
	if (!tempAttendeeSecret) {
		return;
	}
	localStorage.setItem('tempAttendeeSecret', tempAttendeeSecret);
	localStorage.setItem('bonfireId', bonfireId);
};

export const redirectToTempAttendanceInBonfireIfAvailable = async () => {
	console.log('check for redirectToTempAttendanceInBonfireIfAvailable');
	const tempAttendeeSecret = localStorage.getItem('tempAttendeeSecret');
	const bonfireId = localStorage.getItem('bonfireId');
	localStorage.removeItem('tempAttendeeSecret');
	localStorage.removeItem('bonfireId');

	if (bonfireId && tempAttendeeSecretParam) {
		return `/bonfire/${bonfireId}?${tempAttendeeSecretParam}=${tempAttendeeSecret}`;
	}
};

/**
 * Converts a snake_case string to a normal sentence-like string.
 *
 * @param {string} snakeCaseString - The string in snake_case format.
 * @returns {string} - The transformed string in normal sentence format.
 */
export function snakeCaseToNormal(snakeCaseString: string) {
	if (!snakeCaseString) {
		return ''; // Return an empty string if input is undefined or empty
	}

	return snakeCaseString
		.split('_') // Split the string by underscores
		.join(' '); // Join the words with spaces
}

export const checkDeviceSupportsPushNotifications = () => {
	if (typeof window === 'undefined' || typeof navigator == 'undefined') {
		return false;
	}
	const notificationIsSupported = !!(
		(
			window.Notification /* W3C Specification */ ||
			window.webkitNotifications /* old WebKit Browsers */ ||
			navigator.mozNotification
		) /* Firefox for Android and Firefox OS */
	);

	return notificationIsSupported;
};

export const checkAppIsInstallable = () => {
	if (typeof window === 'undefined') {
		return false;
	}

	function isBrowserOnIOS() {
		const ua = window.navigator.userAgent;
		const webkit = !!ua.match(/WebKit/i);
		const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);

		return webkit && iOS;
	}

	// Check for standalone mode in Safari on iOS
	const isStandalone =
		window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

	// The app is installable if it is not already installed and not on iOS
	const isAppInstallable = !isStandalone && !isBrowserOnIOS();

	return isAppInstallable;
};

/**
 * Generates a reminder message string.
 * @param days - The number of days until the event.
 * @param eventName - The name of the event.
 * @returns The formatted reminder message string.
 */
export function generateReminderMessage(days: number, eventName: string): string {
	const dayString = days === 1 ? '1 day' : `${days} days`;
	return `${dayString} reminder! Your event "${eventName}" is coming up! Get ready!`;
}

export function isWithinExpirationDate(expirationDate: Date) {
	return isBefore(new Date(), expirationDate);
}

// Function to create a hash of at least `minLength` characters
export async function createHash(input: string, minLength: number) {
	const encoder = new TextEncoder();
	const data = encoder.encode(input);
	let hashBuffer = await crypto.subtle.digest('SHA-256', data);
	let hashHex = Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Ensure the hash is at least `minLength` characters long
	while (hashHex.length < minLength) {
		hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashHex));
		hashHex = Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	return hashHex.substring(0, minLength);
}
