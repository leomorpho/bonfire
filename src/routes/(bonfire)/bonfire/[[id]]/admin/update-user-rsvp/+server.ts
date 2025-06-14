import { json } from '@sveltejs/kit';
import { isOwnerOrAdmin } from '$lib/auth';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';
import { HistoryChangesConstants, Status } from '$lib/enums';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';
import {
	createAttendeeCountDeltas,
	createUserAttendance,
	upsertEventsPrivateData
} from '$lib/rsvp';

export async function POST({ request, params, locals }) {
	const { targetUserId, targetTempUserId, newStatus, numGuests, adminUserId } =
		await request.json();
	const eventId = params.id;

	// Verify admin permissions
	if (!locals.user || locals.user.id !== adminUserId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!(await isOwnerOrAdmin(adminUserId, eventId))) {
		return json({ error: 'Not authorized to manage attendees' }, { status: 403 });
	}

	try {
		if (targetUserId) {
			// Check if event is open for new attendees
			await checkEventIsOpenForNewGoingAttendees(triplitHttpClient, eventId, newStatus);

			// Get current attendance record
			let attendance = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('attendees').Where([
					and([
						['user_id', '=', targetUserId],
						['event_id', '=', eventId]
					])
				])
			);

			// If attendance does not exist, create it
			if (!attendance) {
				await createUserAttendance(
					triplitHttpClient,
					targetUserId,
					eventId,
					newStatus,
					numGuests || 0
				);
			} else {
				const newNumGuests = numGuests || 0;

				// Create historical entry for the update
				const update = {
					attendee_id: attendance.id,
					changed_by: adminUserId, // Admin making the change
					change_type: HistoryChangesConstants.change_update,
					field_name: HistoryChangesConstants.field_name_status,
					old_value: attendance.status,
					new_value: newStatus
				};

				// Update existing attendance record
				attendance = await triplitHttpClient.update('attendees', attendance.id, (entity) => {
					entity.status = newStatus;
					entity.guest_count = newNumGuests;
				});

				// Create historical entry
				await triplitHttpClient.insert('attendees_changes', update);

				// Update the normalized event counts
				const deltas = createAttendeeCountDeltas(
					attendance?.status as Status,
					newStatus as Status,
					attendance?.guest_count,
					newNumGuests,
					false // false for regular users
				);
				await upsertEventsPrivateData(triplitHttpClient, eventId, deltas);
			}
		} else if (targetTempUserId) {
			// For temp users, we need the secret to update
			// This would require additional logic to get the secret from the temp user ID
			return json({ error: 'Temp user RSVP update not implemented yet' }, { status: 501 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Admin RSVP update error:', error);
		return json({ error: 'Failed to update RSVP' }, { status: 500 });
	}
}
