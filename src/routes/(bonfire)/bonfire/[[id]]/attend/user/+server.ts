import { HistoryChangesConstants, Status } from '$lib/enums.js';
import { triplitHttpClient } from '$lib/server/triplit';
import { createAttendeeId } from '$lib/utils';
import { error, json } from '@sveltejs/kit';
import { and } from '@triplit/client';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';
import type { AttendeeChange } from '$lib/types';
import Attendees from '$lib/components/main-bonfire-event/Attendees.svelte';

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
			attendance = await triplitHttpClient.insert('attendees', {
				id: createAttendeeId(bonfireId, user.id),
				user_id: user.id,
				event_id: bonfireId,
				status,
				guest_count: numGuests
			});
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
		}

		return json({ success: true, attendance });
	} catch (err) {
		console.error('Error processing event attendance:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
