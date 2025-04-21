import { and, HttpClient, TriplitClient } from '@triplit/client';
import { schema } from '../../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { writable, get } from 'svelte/store';
import { browser, dev } from '$app/environment';
import { LOCAL_INDEXEDDB_NAME, Status, UserTypes } from './enums';
import { WorkerClient } from '@triplit/client/worker-client';
import workerUrl from '@triplit/client/worker-client-operator?url';
import { jwtDecode } from 'jwt-decode';
import { createHash, generateReminderMessage } from './utils';

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
let currClientRole = '';

export function getFeWorkerTriplitClient(jwt: string) {
	if (!browser) {
		throw new Error('TriplitClient can only be created in the browser.');
	}
	return new TriplitClient({
		schema,
		serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
		storage: {
			type: dev || !browser ? 'memory' : 'indexeddb',
			name: LOCAL_INDEXEDDB_NAME
		}
	});
	// return new WorkerClient({
	// 	workerUrl: dev ? workerUrl : undefined,
	// 	storage: {
	// 		type: dev || !browser ? 'memory' : 'indexeddb',
	// 		name: LOCAL_INDEXEDDB_NAME
	// 	},
	// 	schema,
	// 	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	// 	token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
	// });
	try {
		// Decode JWT to extract role
		const decoded = jwtDecode(jwt); // Decodes without verifying (safe for role extraction)
		const newRole = decoded?.role || ''; // Adjust based on your JWT payload structure

		// Return existing client if available
		// Check if role has changed
		if (feWorkerTriplitClient && newRole === currClientRole) {
			return feWorkerTriplitClient;
		}

		// Update stored role
		currClientRole = newRole;

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
			type: dev || !browser ? 'memory' : 'indexeddb',
			name: LOCAL_INDEXEDDB_NAME
		},
		schema,
		serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
		token: jwt ? jwt : publicEnv.PUBLIC_TRIPLIT_ANONYMOUS_TOKEN,
		autoConnect: browser,

		onSessionError: async (type) => {
			console.log('💀 Triplit session error occurred:', type);
			if (type === 'ROLES_MISMATCH') {
				await feWorkerTriplitClient?.endSession();
				const newJwt = await getFreshToken();
				await feWorkerTriplitClient?.startSession(newJwt, true, {
					refreshHandler: async () => await getFreshToken()
				});
			}
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

export async function getFreshToken() {
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

export async function clearCache(client: TriplitClient | null, fullClear: boolean = false) {
	if (!client) {
		await feWorkerTriplitClient?.endSession();
		await feWorkerTriplitClient?.clear({ full: fullClear });
	} else {
		await client.endSession();
		await client.clear({ full: fullClear });
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
			.Where([['id', '=', bonfireId]])
			.Select(['max_capacity'])
			.SubqueryOne(
				'going_users',
				client
					.query('attendees')
					.Where([
						and([
							['status', '=', Status.GOING],
							['event_id', '=', '$1.id']
						])
					])
					.Select(['id'])
			)
			.SubqueryOne(
				'going_temps',
				client
					.query('temporary_attendees')
					.Where([
						and([
							['status', '=', Status.GOING],
							['event_id', '=', '$1.id']
						])
					])
					.Select(['id'])
			)
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

export const createRemindersObjects = async (
	client: HttpClient,
	eventId: string,
	eventName: string,
	eventStartDatetime: Date
) => {
	// Calculate the send_at dates for the reminders
	const oneWeekBefore = new Date(eventStartDatetime.getTime() - 24 * 7 * 60 * 60 * 1000);
	const oneWeekBeforeInHours = 24 * 7;
	const oneDayBefore = new Date(eventStartDatetime.getTime() - 24 * 60 * 60 * 1000);
	const onDayBeforeInHours = 24;

	const firstText = generateReminderMessage(7, eventName);

	// Create the reminder for GOING and MAYBE attendees one week before the event
	await client.insert('event_reminders', {
		id: 'er_' + (await createHash(firstText)),
		event_id: eventId,
		lead_time_in_hours_before_event_starts: oneWeekBeforeInHours,
		target_attendee_statuses: new Set([Status.GOING, Status.MAYBE]),
		send_at: oneWeekBefore,
		text: generateReminderMessage(7, eventName)
	});

	const secondText = generateReminderMessage(1, eventName);

	// Create the reminder for GOING attendees one day before the event
	await client.insert('event_reminders', {
		id: 'er_' + (await createHash(secondText)),
		event_id: eventId,
		lead_time_in_hours_before_event_starts: onDayBeforeInHours,
		target_attendee_statuses: new Set([Status.GOING]),
		send_at: oneDayBefore,
		text: secondText
	});
};
