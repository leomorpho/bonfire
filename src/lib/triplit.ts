import { TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { writable, get } from 'svelte/store';
import { browser, dev } from '$app/environment';
import { LOCAL_INDEXEDDB_NAME } from './enums';

export const userIdStore = writable<string | null>(null);

export async function waitForUserId(timeout = 5000) {
	return new Promise((resolve, reject) => {
		const start = Date.now();

		const checkUserId = () => {
			const value = get(userIdStore);
			if (value) {
				resolve(value);
			} else if (Date.now() - start > timeout) {
				reject(new Error('Timed out waiting for user ID'));
			} else {
				setTimeout(checkUserId, 100); // Check again after a short delay
			}
		};
		checkUserId();
	});
}

let feTriplitClient: TriplitClient;

export function getFeTriplitClient(jwt: string) {
	// if (!browser) {
	// 	throw new Error('TriplitClient can only be created in the browser.');
	// }

	if (feTriplitClient) {
		return feTriplitClient;
	}
	feTriplitClient = new TriplitClient({
		storage: {
			type: 'indexeddb',
			name: LOCAL_INDEXEDDB_NAME
		},
		schema,
		serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
		autoConnect: browser,
		onSessionError: (type) => {
			console.log('💀💀💀 Triplit session error occured', type);
			if (type === 'TOKEN_EXPIRED') {
				// log the user out
				feTriplitClient.endSession();
				feTriplitClient.clear();
			}
		},
		refreshOptions: {
			refreshHandler: async () => {
				// get a new token
				return await getFreshToken();
			}
		},
		logLevel: dev ? 'debug' : 'info'
	}) as TriplitClient;

	console.log('Frontend TriplitClient initialized');

	return feTriplitClient;
}

async function getFreshToken() {
	try {
		const response = await fetch('/jwt');
		if (!response.ok) {
			throw new Error(`Failed to fetch JWT: ${response.statusText}`);
		}
		const data = await response.json();
		return data.jwt ?? null;
	} catch (error) {
		console.error('Error fetching JWT:', error);
		return null;
	}
}

export async function clearCache(client: TriplitClient) {
	await client.endSession();
	await client.clear();
}
