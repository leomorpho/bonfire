import { HistoryChangesConstants, Status } from '$lib/enums.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { error, json } from '@sveltejs/kit';
import { and } from '@triplit/client';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';
import type { AttendeeChange } from '$lib/types';
import {
	createAttendeeCountDeltas,
	createUserAttendance,
	upsertEventsPrivateData
} from '$lib/rsvp.js';

// Check if user has required tickets for paid events
async function checkUserHasTicketsForEvent(
	client: any,
	userId: string,
	eventId: string
): Promise<boolean> {
	try {
		// First check if event requires tickets
		const event = await client.fetchOne(client.query('events').Where([['id', '=', eventId]]));

		if (!event || !event.is_ticketed) {
			// Event doesn't require tickets, allow RSVP
			return true;
		}

		// Check if user has active tickets for this event
		const userTickets = await client.fetch(
			client
				.query('tickets')
				.Where([['user_id', '=', userId]])
				.Where([['ticket_type.event_id', '=', eventId]])
				.Where([['status', '=', 'active']])
		);

		return userTickets.length > 0;
	} catch (error) {
		console.error('Error checking user tickets:', error);
		// In case of error, be permissive (could be a database issue)
		return true;
	}
}

export const POST = async ({ request, params, locals }) => {
	// Extract event ID from the URL params
	const bonfireId = params.id;

	if (!bonfireId) {
		return json({ error: 'No event ID provided' }, { status: 400 });
	}

	// Extract user from locals
	const user = locals.user;
	if (!user) {
		throw error(401, 'Unauthorized'); // Return 401 if user is not logged in
	}

	// Parse request body
	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { status, numGuests } = requestBody;

	if (!status) {
		return json({ error: 'Missing status' }, { status: 400 });
	}

	await checkEventIsOpenForNewGoingAttendees(triplitHttpClient, bonfireId, status);

	// Check if user has required tickets for paid events
	if (status === Status.GOING || status === Status.MAYBE) {
		const hasRequiredTickets = await checkUserHasTicketsForEvent(
			triplitHttpClient,
			user.id,
			bonfireId
		);
		if (!hasRequiredTickets) {
			return json(
				{ error: 'You must purchase tickets before you can RSVP to this event' },
				{ status: 400 }
			);
		}
	}

	try {
		// Check if attendance record exists
		let attendance = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('attendees').Where([
				and([
					['user_id', '=', user.id],
					['event_id', '=', bonfireId]
				])
			])
		);

		// If attendance does not exist, create it
		if (!attendance) {
			await createUserAttendance(triplitHttpClient, user.id, bonfireId, status, numGuests);
		} else {
			let newNumGuest = attendance.guest_count;
			if (numGuests !== null && Number.isInteger(numGuests)) {
				newNumGuest = numGuests;
			}

			// Only create historical entry for update/delete (not create)
			const update: AttendeeChange = {
				attendee_id: attendance.id,
				changed_by: user.id,
				change_type: HistoryChangesConstants.change_update
			};

			// Status was changed
			if (attendance.status != status) {
				update.field_name = HistoryChangesConstants.field_name_status;
				update.old_value = attendance.status;
				update.new_value = status;
			}
			// Number of guests was changed
			if (attendance.guest_count != numGuests) {
				update.field_name = HistoryChangesConstants.field_name_num_guests;
				update.old_value = attendance.guest_count?.toString();
				update.new_value = numGuests.toString();
			}

			// Update existing attendance record
			attendance = await triplitHttpClient.update('attendees', attendance.id, (entity) => {
				entity.status = status;
				entity.guest_count = newNumGuest;
			});

			// Create historical entry
			await triplitHttpClient.insert('attendees_changes', update);

			// Update the normalized event counts
			const deltas = createAttendeeCountDeltas(
				attendance?.status as Status,
				status as Status,
				attendance?.guest_count,
				numGuests,
				true
			);
			await upsertEventsPrivateData(triplitHttpClient, bonfireId, deltas);
		}

		return json({ success: true, attendance });
	} catch (err) {
		console.error('Error processing event attendance:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
