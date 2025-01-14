import { TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { PUBLIC_TRIPLIT_URL, PUBLIC_TRIPLIT_ANONYMOUS_TOKEN } from '$env/static/public';
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
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
		serverUrl: PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
		autoConnect: browser
	}) as TriplitClient;

	console.log('Frontend TriplitClient initialized');

	return feTriplitClient;
}

export async function clearCache(client: TriplitClient) {
	client.reset();
	await client.reset();
}