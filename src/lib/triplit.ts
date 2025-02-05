import { and, HttpClient, TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { writable, get } from 'svelte/store';
import { browser, dev } from '$app/environment';
import { LOCAL_INDEXEDDB_NAME, Status } from './enums';
import { WorkerClient } from '@triplit/client/worker-client';
import workerUrl from '@triplit/client/worker-client-operator?url';

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

let feTriplitClient: WorkerClient | TriplitClient;

export function getFeTriplitClient(jwt: string) {
	if (!browser) {
		throw new Error('TriplitClient can only be created in the browser.');
	}

	if (feTriplitClient) {
		return feTriplitClient;
	}

	if (window.client) {
		feTriplitClient = window.client;
		return window.client;
	}

	feTriplitClient = createNewTriplitClient(jwt);

	console.log('Frontend TriplitClient initialized');

	// Make client available on window to help inspection during debugging
	if (typeof window !== 'undefined') window.client = feTriplitClient;

	return feTriplitClient;
}

const createNewTriplitClient = (jwt: string) => {
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
					await feTriplitClient?.endSession();
					await feTriplitClient?.startSession(newJwt, true, {
						refreshHandler: async () => await getFreshToken()
					});
					feTriplitClient?.updateSessionToken(newJwt);
					console.log('✅ Triplit session updated with new JWT');
				} else {
					console.error('❌ Failed to refresh JWT, logging out...');
					await feTriplitClient?.endSession();
					feTriplitClient?.clear();
				}
			}
		},
		refreshOptions: {
			refreshHandler: async () => {
				// get a new token
				return await getFreshToken();
			}
		},
		logLevel: dev ? 'debug' : 'info'
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
