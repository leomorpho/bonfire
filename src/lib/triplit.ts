import { and, HttpClient, TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { writable, get } from 'svelte/store';
import { browser, dev } from '$app/environment';
import { LOCAL_INDEXEDDB_NAME, Status, UserTypes } from './enums';
import { WorkerClient } from '@triplit/client/worker-client';
import workerUrl from '@triplit/client/worker-client-operator?url';
import { jwtDecode } from 'jwt-decode';

const TRIPLIT_TOKEN_TYPE_KEY = 'type'; // LocalStorage key for storing user type

export const userIdStore = writable<string | null>(null);
export const userTypeStore = writable<string | null>(null);

export async function waitForUserId(timeout = 5000) {
	return new Promise((resolve) => {
		const start = Date.now();

		const checkUserId = () => {
			const userId = get(userIdStore);
			const userType = get(userTypeStore); // Retrieve the user's type

			// If user ID is available, resolve it
			if (userId) {
				resolve(userId);
				return;
			}

			// If the user is anonymous or temp, resolve with null
			if (userType != UserTypes.USER) {
				resolve(null);
				return;
			}

			// If the timeout is reached, resolve with null (instead of rejecting)
			if (Date.now() - start > timeout) {
				resolve(null);
				return;
			}

			// Retry after a short delay
			setTimeout(checkUserId, 100);
		};

		checkUserId();
	});
}

export let feHttpTriplitClient: HttpClient | null;

export function getFeHttpTriplitClient(jwt: string) {
	return new HttpClient({
		serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN
	});
}

let feWorkerTriplitClient: WorkerClient | TriplitClient | null;

export function getFeWorkerTriplitClient(jwt: string) {
	if (!browser) {
		throw new Error('TriplitClient can only be created in the browser.');
	}

	try {
		if (jwt) {
			const decoded = jwtDecode(jwt); // Decode the JWT safely
			const currentType = decoded?.type; // Extract the 'type' field
			userTypeStore.set(currentType);

			if (!currentType) {
				throw new Error('Invalid JWT: Missing type key.');
			}

			// Get previously stored type
			const storedType = localStorage.getItem(TRIPLIT_TOKEN_TYPE_KEY);

			// If the type has changed, reset the client
			if (storedType && storedType !== currentType) {
				console.log('User type changed, creating a new Triplit client...');
				feWorkerTriplitClient?.endSession();
				feWorkerTriplitClient = null;
				window.client = null;
			}

			// Store the current type for future checks
			localStorage.setItem(TRIPLIT_TOKEN_TYPE_KEY, currentType);
		}

		// Return existing client if available
		if (feWorkerTriplitClient) return feWorkerTriplitClient;
		if (window.client) {
			feWorkerTriplitClient = window.client;
			return window.client;
		}

		// Create a new client if no existing one is found
		feWorkerTriplitClient = createNewWorkerTriplitClient(jwt);
		console.log('Frontend TriplitClient initialized');

		// Expose client on window for debugging
		window.client = feWorkerTriplitClient;
		return feWorkerTriplitClient;
	} catch (error) {
		console.error('Error initializing TriplitClient:', error);
		throw new Error('Failed to initialize TriplitClient.');
	}
}

const createNewWorkerTriplitClient = (jwt: string) => {
	return new WorkerClient({
		workerUrl: dev ? workerUrl : undefined,
		storage: {
			type: 'indexeddb',
			name: LOCAL_INDEXEDDB_NAME
		},
		schema,
		serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
		autoConnect: browser,
		onSessionError: async (type) => {
			console.log('💀 Triplit session error occurred:', type);
			if (type === 'TOKEN_EXPIRED') {
				console.warn('🔄 JWT expired, refreshing token...');
				const newJwt = await getFreshToken();

				if (newJwt) {
					console.log('🔑 JWT refreshed, updating session...');
					await feWorkerTriplitClient?.endSession();
					await feWorkerTriplitClient?.startSession(newJwt, true, {
						refreshHandler: async () => await getFreshToken()
					});
					feWorkerTriplitClient?.updateSessionToken(newJwt);
					console.log('✅ Triplit session updated with new JWT');
				} else {
					console.error('❌ Failed to refresh JWT, logging out...');
					await feWorkerTriplitClient?.endSession();
					feWorkerTriplitClient?.clear();
				}
			}
		},
		refreshOptions: {
			refreshHandler: async () => {
				// get a new token
				return await getFreshToken();
			}
		},
		logLevel: dev ? 'debug' : 'info',
		defaultQueryOptions: {
			fetch: {
				policy: 'remote-first'
			}
		}
	}) as WorkerClient;
};

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

export async function upsertUserAttendance(eventId: string, status: Status) {
	try {
		const response = await fetch(`/bonfire/${eventId}/attend/user`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to update attendance');
		}

		const data = await response.json();
		console.log('✅ Attendance updated:', data);
		return data.attendance; // Return updated attendance object
	} catch (err) {
		console.error('❌ Error updating attendance:', err);
		throw err;
	}
}

export async function checkEventIsOpenForNewGoingAttendees(
	client: TriplitClient | WorkerClient | HttpClient,
	bonfireId: string,
	newStatus: Status
) {
	const event = await client.fetchOne(
		client
			.query('events')
			.where([['id', '=', bonfireId]])
			.select(['max_capacity'])
			.subquery(
				'going_users',
				client
					.query('attendees')
					.where([
						and([
							['status', '=', Status.GOING],
							['event_id', '=', '$1.id']
						])
					])
					.select(['id'])
					.build(),
				'one'
			)
			.subquery(
				'going_temps',
				client
					.query('temporary_attendees')
					.where([
						and([
							['status', '=', Status.GOING],
							['event_id', '=', '$1.id']
						])
					])
					.select(['id'])
					.build(),
				'one'
			)
			.build()
	);
	// Check that max capacity is indeed set
	if (!event || !event.max_capacity) {
		return;
	}

	// If the event is at capacity, prevent updates to GOING
	if (newStatus === Status.GOING && event) {
		const goingUsersCount = event.going_users ? event.going_users.length : 0;
		const goingTempsCount = event.going_temps ? event.going_temps.length : 0;

		if (goingUsersCount + goingTempsCount >= event.max_capacity) {
			throw new Error('Event has reached maximum capacity');
		}
	}
}
