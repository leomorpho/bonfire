import { and, HttpClient } from '@triplit/client';
import {
	HistoryChangesConstants,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	tempAttendeeSecretParam
} from './enums';
import { createNewAttendanceNotificationQueueObject } from './notification_queue';
import { generatePassphraseId } from './utils';
import { TriplitClient } from '@triplit/client';
import { Status } from './enums';

export const createAttendeeId = (eventId: string, userId: string) => {
	return 'at_' + eventId + '-' + userId;
};

export const createTempAttendance = async (
	client: HttpClient,
	secretId: string | null,
	eventId: string,
	newStatus: string,
	username: string,
	numExtraGuests: number
) => {
	if (!secretId) {
		secretId = await generatePassphraseId('', 25);
	}

	const tempAttendance = await client.insert('temporary_attendees', {
		id: await generatePassphraseId('ta_'),
		event_id: eventId,
		status: newStatus, // Default status if not provided
		name: username,
		guest_count: numExtraGuests
	});
	console.log('Created temp attendee');

	await client.insert('temporary_attendees_secret_mapping', {
		id: secretId,
		temporary_attendee_id: tempAttendance.id
	});
	console.log('Created temporary_attendees_secret_mapping');

	await client.insert('temporary_attendees_changes', {
		temporary_attendee_id: tempAttendance.id,
		changed_by: tempAttendance.id,
		changed_by_id_type: HistoryChangesConstants.temporary_attendee_id,
		change_type: HistoryChangesConstants.change_create,
		field_name: HistoryChangesConstants.field_name_status,
		new_value: newStatus
	});

	// Update the normalized event counts
	const deltas = createAttendeeCountDeltas(null, newStatus as Status, null, numExtraGuests, true);
	await upsertEventsPrivateData(client, eventId, deltas);

	console.log('Created temporary_attendees_changes');
};

export const createUserAttendance = async (
	client: HttpClient,
	userId: string,
	eventId: string,
	newStatus: string,
	numExtraGuests: number
) => {
	// Check if user was previously deleted from event
	if (await wasUserPreviouslyDeleted(client, userId, eventId)) {
		throw new Error('user was previously deleted from event and cannot rsvp anymore');
	}

	const attendance = await client.insert('attendees', {
		id: createAttendeeId(eventId, userId),
		user_id: userId,
		event_id: eventId,
		status: newStatus,
		guest_count: numExtraGuests
	});
	console.log('attendance created');

	await client.insert('attendees_changes', {
		attendee_id: attendance.id,
		changed_by: userId,
		change_type: HistoryChangesConstants.change_create,
		field_name: HistoryChangesConstants.field_name_status,
		new_value: newStatus
	});

	// Update the normalized event counts
	const deltas = createAttendeeCountDeltas(null, newStatus as Status, null, numExtraGuests, false);
	await upsertEventsPrivateData(client, eventId, deltas);

	return attendance;
};

// upsertUserAttendance calls the server to enforce BE rules
export async function upsertUserAttendance(
	eventId: string,
	status: Status,
	numGuests: number | null
) {
	try {
		const response = await fetch(`/bonfire/${eventId}/attend/user`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status, numGuests })
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

// Check if user needs to purchase tickets for this event
export async function checkIfTicketRequired(eventId: string): Promise<{
	isTicketed: boolean;
	hasTickets: boolean;
	ticketTypes: any[];
	redirectToTickets: boolean;
	isIncomplete: boolean;
}> {
	try {
		// First check if event is ticketed
		const eventResponse = await fetch(`/api/events/${eventId}/basic`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		if (!eventResponse.ok) {
			throw new Error('Failed to fetch event details');
		}

		const eventData = await eventResponse.json();

		if (!eventData.is_ticketed) {
			return {
				isTicketed: false,
				hasTickets: false,
				ticketTypes: [],
				redirectToTickets: false,
				isIncomplete: false
			};
		}

		// Check if ticketed event is incomplete (no currency or no ticket types)
		const isIncomplete = !eventData.ticket_currency || !eventData.ticket_currency.trim();

		// Check if user already has tickets
		const ticketsResponse = await fetch(`/api/user/tickets?eventId=${eventId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		let hasTickets = false;
		if (ticketsResponse.ok) {
			const ticketsData = await ticketsResponse.json();
			hasTickets = ticketsData.tickets && ticketsData.tickets.length > 0;
		}

		// Get available ticket types
		const ticketTypesResponse = await fetch(`/api/tickets/types?eventId=${eventId}`, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' }
		});

		let ticketTypes = [];
		if (ticketTypesResponse.ok) {
			const typesData = await ticketTypesResponse.json();
			ticketTypes = typesData.ticketTypes || [];
		}

		// Update isIncomplete check to include no ticket types
		const finalIsIncomplete = isIncomplete || ticketTypes.length === 0;

		return {
			isTicketed: true,
			hasTickets,
			ticketTypes,
			redirectToTickets: !hasTickets && !finalIsIncomplete, // Only redirect if event is complete
			isIncomplete: finalIsIncomplete
		};
	} catch (error) {
		console.error('Error checking ticket requirements:', error);
		return {
			isTicketed: false,
			hasTickets: false,
			ticketTypes: [],
			redirectToTickets: false,
			isIncomplete: false
		};
	}
}

// updateRSVPForLoggedInUser calls upsertUserAttendance which calls the server behind the scenes.
// Offloads some work to the FE.
export const updateRSVPForLoggedInUser = async (
	client: TriplitClient,
	userId: string,
	eventId: string,
	prevStatus: string,
	newStatus: string,
	numGuestsCurrentAttendeeIsBringing: number | null
) => {
	try {
		const query = client.query('attendees').Where([
			and([
				['user_id', '=', userId],
				['event_id', '=', eventId as string]
			])
		]);
		const attendance = await client.fetchOne(query);

		if (!userId || !eventId) {
			console.error(
				`updateRSVPForLoggedInUser: userId (${userId}) or eventId (${eventId}) is missing and prevents update of RSVP status for logged in user`
			);
			return;
		}

		let attendanceId = attendance?.id;

		try {
			await upsertUserAttendance(eventId, newStatus as Status, numGuestsCurrentAttendeeIsBringing);
			if (!attendanceId) {
				attendanceId = attendance?.id;
			}
		} catch (e) {
			if (!attendanceId) {
				console.error(
					`failed to create attendance for event ${eventId} and user ${userId}:`,
					newStatus,
					e
				);
			} else {
				console.error('failed to update attendance:', newStatus, e);
			}
		}

		if (NOTIFY_OF_ATTENDING_STATUS_CHANGE.includes(newStatus as Status)) {
			try {
				await createNewAttendanceNotificationQueueObject(client, userId, eventId, [attendanceId]);
			} catch (e) {
				console.log('failed to create attendance notifications:', newStatus, e);
			}
		}

		// Perform any additional actions, e.g., API call to save the new RSVP status
		console.log('RSVP updated to:', newStatus);
	} catch (error) {
		console.log('failed to update RSVP status to:', newStatus, error);
	}
};

export const updateRSVPForTempUser = async (
	newValue: string,
	eventId: string,
	tempAttendeeSecret: string,
	numGuestsCurrentAttendeeIsBringing: number | null
) => {
	// Call the SvelteKit endpoint to update RSVP
	const response = await fetch(
		`/bonfire/${eventId}/attend/temp-user/update-rsvp?${tempAttendeeSecretParam}=${tempAttendeeSecret}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				tempAttendeeSecret,
				rsvpStatus: newValue,
				numGuestsCurrentAttendeeIsBringing: numGuestsCurrentAttendeeIsBringing
			})
		}
	);
	// NOTE: historical changes managed by endpoint above

	if (!response.ok) {
		const errorMessage = await response.text();
		throw new Error(errorMessage || 'Failed to update RSVP status.');
	}
};

export const removeRealAttendee = async (
	client: TriplitClient,
	attendanceId: string,
	userIdDeletingAttendee: string
) => {
	await client.http.update('attendees', attendanceId, (e) => {
		e.status = Status.REMOVED;
		e.guest_count = 0;
		e.updated_at = new Date();
	});
	await client.http.insert('attendees_changes', {
		attendee_id: attendanceId,
		changed_by: userIdDeletingAttendee,
		change_type: HistoryChangesConstants.change_delete
	});
};

export const removeTempAttendee = async (
	client: TriplitClient,
	attendanceId: string,
	userIdDeletingTempAttendee: string
) => {
	await client.http.update('temporary_attendees', attendanceId, (e) => {
		e.status = Status.REMOVED;
		e.guest_count = 0;
		e.updated_at = new Date();
	});
	await client.http.insert('temporary_attendees_changes', {
		temporary_attendee_id: attendanceId,
		changed_by: userIdDeletingTempAttendee,
		changed_by_id_type: HistoryChangesConstants.user_id,
		change_type: HistoryChangesConstants.change_delete
	});
};

/**
 * Check if a user was previously deleted from an event.
 * @param client - The HTTP client to interact with the database.
 * @param userId - The ID of the user to check.
 * @param eventId - The ID of the event to check.
 * @returns {Promise<boolean>} - True if the user was previously deleted, false otherwise.
 */
export const wasUserPreviouslyDeleted = async (
	client: TriplitClient | HttpClient,
	userId: string,
	eventId: string
): Promise<boolean> => {
	try {
		const query = client.query('attendees_changes').Where([
			and([
				['attendee.event_id', '=', eventId],
				['attendee.user.id', '=', userId],
				['change_type', '=', HistoryChangesConstants.change_delete]
			])
		]);

		const changes = await client.fetch(query);
		return changes.length > 0;
	} catch (error) {
		console.error('Error checking if user was previously deleted:', error);
		return false;
	}
};

interface AttendeeCounts {
	num_attendees_going: number;
	num_attendees_not_going: number;
	num_attendees_maybe: number;
	num_attendees_waitlisted: number;
	num_attendees_left: number;
	num_attendees_removed: number;
	num_attendees_invited: number;
	num_temp_attendees_going: number;
	num_temp_attendees_not_going: number;
	num_temp_attendees_maybe: number;
	num_temp_attendees_waitlisted: number;
	num_temp_attendees_left: number;
	num_temp_attendees_removed: number;
	num_temp_attendees_invited: number;
}

interface AttendeeCountDeltas {
	num_attendees_going?: number;
	num_attendees_not_going?: number;
	num_attendees_maybe?: number;
	num_attendees_waitlisted?: number;
	num_attendees_left?: number;
	num_attendees_removed?: number;
	num_attendees_invited?: number;
	num_temp_attendees_going?: number;
	num_temp_attendees_not_going?: number;
	num_temp_attendees_maybe?: number;
	num_temp_attendees_waitlisted?: number;
	num_temp_attendees_left?: number;
	num_temp_attendees_removed?: number;
	num_temp_attendees_invited?: number;
}

/**
 * Create deltas based on the status, attendee type, and number of attendees.
 * @param prevStatus - The previous status of the attendees.
 * @param newStatus - The new status of the attendees.
 * @param isTemp - Whether the attendees are temporary.
 * @param prevNumGuests - The previous number of guests (can be null).
 * @param newNumGuests - The new number of guests (can be null).
 * @returns The deltas for the attendee counts.
 */
export const createAttendeeCountDeltas = (
	prevStatus: Status | null,
	newStatus: Status,
	prevNumGuests: number | null | undefined,
	newNumGuests: number | null,
	isTemp: boolean
): AttendeeCountDeltas => {
	const deltas: AttendeeCountDeltas = {};

	// Handle null values for prevNumGuests and newNumGuests
	const safePrevNumGuests = prevNumGuests ?? 0;
	const safeNewNumGuests = newNumGuests ?? 0;

	// Helper function to update deltas
	const updateDelta = (status: Status, count: number, isIncrement: boolean) => {
		const key = isTemp
			? `num_temp_attendees_${status.toLowerCase()}`
			: `num_attendees_${status.toLowerCase()}`;
		deltas[key] = (deltas[key] || 0) + (isIncrement ? count : -count);
	};

	// Decrement the previous status count
	if (prevStatus) {
		updateDelta(prevStatus, 1 + safePrevNumGuests, false);
	}

	// Increment the new status count
	updateDelta(newStatus, 1 + safeNewNumGuests, true);

	return deltas;
};

/**
 * Normalize the count by status for events_private_data per event.
 * @param client - The TriplitClient to interact with the database.
 * @param eventId - The ID of the event to normalize counts for.
 */
export const normalizeAttendeeCounts = async (
	client: TriplitClient,
	eventId: string
): Promise<AttendeeCounts> => {
	try {
		// Query all permanent attendees for the event
		const permanentAttendees = await client.fetch(
			client
				.query('attendees')
				.Where([['event_id', '=', eventId]])
				.Select(['status', 'guest_count'])
		);

		// Query all temporary attendees for the event
		const tempAttendees = await client.fetch(
			client
				.query('temporary_attendees')
				.Where([['event_id', '=', eventId]])
				.Select(['status', 'guest_count'])
		);

		// Initialize counts
		const counts = {
			num_attendees_going: 0,
			num_attendees_not_going: 0,
			num_attendees_maybe: 0,
			num_attendees_waitlisted: 0,
			num_attendees_left: 0,
			num_attendees_removed: 0,
			num_attendees_invited: 0,
			num_temp_attendees_going: 0,
			num_temp_attendees_not_going: 0,
			num_temp_attendees_maybe: 0,
			num_temp_attendees_waitlisted: 0,
			num_temp_attendees_left: 0,
			num_temp_attendees_removed: 0,
			num_temp_attendees_invited: 0
		};

		// Count permanent attendees by status
		permanentAttendees.forEach((attendee) => {
			switch (attendee.status) {
				case Status.GOING:
					counts.num_attendees_going += 1 + attendee.guest_count;
					break;
				case Status.NOT_GOING:
					counts.num_attendees_not_going += 1 + attendee.guest_count;
					break;
				case Status.MAYBE:
					counts.num_attendees_maybe += 1 + attendee.guest_count;
					break;
				case Status.WAITLIST:
					counts.num_attendees_waitlisted += 1 + attendee.guest_count;
					break;
				case Status.LEFT:
					counts.num_attendees_left += 1 + attendee.guest_count;
					break;
				case Status.REMOVED:
					counts.num_attendees_removed += 1 + attendee.guest_count;
					break;
				case Status.INVITED:
					counts.num_attendees_invited += 1 + attendee.guest_count;
					break;
			}
		});

		// Count temporary attendees by status
		tempAttendees.forEach((attendee) => {
			switch (attendee.status) {
				case Status.GOING:
					counts.num_temp_attendees_going += 1 + attendee.guest_count;
					break;
				case Status.NOT_GOING:
					counts.num_temp_attendees_not_going += 1 + attendee.guest_count;
					break;
				case Status.MAYBE:
					counts.num_temp_attendees_maybe += 1 + attendee.guest_count;
					break;
				case Status.WAITLIST:
					counts.num_temp_attendees_waitlisted += 1 + attendee.guest_count;
					break;
				case Status.LEFT:
					counts.num_temp_attendees_left += 1 + attendee.guest_count;
					break;
				case Status.REMOVED:
					counts.num_temp_attendees_removed += 1 + attendee.guest_count;
					break;
				case Status.INVITED:
					counts.num_temp_attendees_invited += 1 + attendee.guest_count;
					break;
			}
		});

		return counts;
	} catch (error) {
		console.error('Error normalizing attendee counts:', error);
		throw error;
	}
};

/**
 * Upsert the events_private_data with the normalized counts.
 * @param client - The TriplitClient to interact with the database.
 * @param eventId - The ID of the event.
 * @param counts - The normalized counts of attendees by status.
 */
export const upsertEventsPrivateData = async (
	client: HttpClient,
	eventId: string,
	deltas: AttendeeCountDeltas
) => {
	try {
		// Check if events_private_data exists for the event
		const existingData = await client.fetchOne(
			client.query('events_private_data').Where([['event_id', '=', eventId]])
		);

		if (existingData) {
			// Fetch the current counts
			const currentCounts = existingData as AttendeeCounts;

			// Update the counts based on the deltas
			const updatedCounts = {
				num_attendees_going:
					(currentCounts.num_attendees_going || 0) + (deltas.num_attendees_going || 0),
				num_attendees_not_going:
					(currentCounts.num_attendees_not_going || 0) + (deltas.num_attendees_not_going || 0),
				num_attendees_maybe:
					(currentCounts.num_attendees_maybe || 0) + (deltas.num_attendees_maybe || 0),
				num_attendees_waitlisted:
					(currentCounts.num_attendees_waitlisted || 0) + (deltas.num_attendees_waitlisted || 0),
				num_attendees_left:
					(currentCounts.num_attendees_left || 0) + (deltas.num_attendees_left || 0),
				num_attendees_removed:
					(currentCounts.num_attendees_removed || 0) + (deltas.num_attendees_removed || 0),
				num_attendees_invited:
					(currentCounts.num_attendees_invited || 0) + (deltas.num_attendees_invited || 0),
				num_temp_attendees_going:
					(currentCounts.num_temp_attendees_going || 0) + (deltas.num_temp_attendees_going || 0),
				num_temp_attendees_not_going:
					(currentCounts.num_temp_attendees_not_going || 0) +
					(deltas.num_temp_attendees_not_going || 0),
				num_temp_attendees_maybe:
					(currentCounts.num_temp_attendees_maybe || 0) + (deltas.num_temp_attendees_maybe || 0),
				num_temp_attendees_waitlisted:
					(currentCounts.num_temp_attendees_waitlisted || 0) +
					(deltas.num_temp_attendees_waitlisted || 0),
				num_temp_attendees_left:
					(currentCounts.num_temp_attendees_left || 0) + (deltas.num_temp_attendees_left || 0),
				num_temp_attendees_removed:
					(currentCounts.num_temp_attendees_removed || 0) +
					(deltas.num_temp_attendees_removed || 0),
				num_temp_attendees_invited:
					(currentCounts.num_temp_attendees_invited || 0) + (deltas.num_temp_attendees_invited || 0)
			};

			// Update the existing record with the updated counts
			await client.update('events_private_data', existingData.id, updatedCounts);
		} else {
			const fullCounts = await normalizeAttendeeCounts(client, eventId);

			// Insert a new record
			await client.insert('events_private_data', {
				id: `epd_${eventId}`,
				event_id: eventId,
				...fullCounts
				// We don't care about deltas since we're gonna evaluate for all anyways
			});
		}
	} catch (error) {
		console.error('Error upserting events_private_data:', error);
	}
};

export const isStartDateBeforeCutoff = (
	isCuttoffDateEnabled: boolean = false,
	cuttoffDate: Date | null = null
) => {
	return !isCuttoffDateEnabled || (isCuttoffDateEnabled && cuttoffDate && new Date() < cuttoffDate);
};
