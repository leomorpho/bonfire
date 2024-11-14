import { TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { PUBLIC_TRIPLIT_URL, PUBLIC_TRIPLIT_TOKEN } from '$env/static/public';
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export const userIdStore = writable(null);

export async function waitForUserId() {
	return new Promise((resolve) => {
		const checkUserId = () => {
			const value = get(userIdStore);
			if (value) {
				resolve(value);
			} else {
				setTimeout(checkUserId, 100); // Check again after a short delay
			}
		};
		checkUserId();
	});
}

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: PUBLIC_TRIPLIT_TOKEN
});

// Ensure feTriplitClient is only created in the browser
export const feTriplitClient = browser
	? new TriplitClient({
			storage: 'indexeddb',
			schema,
			serverUrl: PUBLIC_TRIPLIT_URL,
			token: PUBLIC_TRIPLIT_TOKEN
	  })
	: null;