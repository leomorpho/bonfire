import { error, type RequestHandler } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import {
	HistoryChangesConstants,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	Status,
	tempAttendeeSecretParam
} from '$lib/enums';
import { createNewTemporaryAttendanceNotificationQueueObject } from '$lib/notification_queue';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';
import type { TemporaryAttendeeChange } from '$lib/types';
import { createAttendeeCountDeltas, upsertEventsPrivateData } from '$lib/rsvp';

export const POST: RequestHandler = async ({ url, request }): Promise<Response> => {
	try {
		const tempAttendeeSecretString = url.searchParams.get(tempAttendeeSecretParam);

		if (!tempAttendeeSecretString) {
			throw error(400, 'No temporary attendee secret provided.');
		}

		const { rsvpStatus, numGuestsCurrentAttendeeIsBringing } = await request.json();
		if (!rsvpStatus) {
			throw error(400, 'RSVP status is required.');
		}

		const tempAttendeeSecret = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees_secret_mapping')
				.Where(['id', '=', tempAttendeeSecretString])
				.Include('temporary_attendee')
		);

		if (!tempAttendeeSecret) {
			throw error(404, 'Invalid secret.');
		}

		const temporaryAttendee = tempAttendeeSecret.temporary_attendee;
		if (!temporaryAttendee) {
			console.error(
				`Unexpected error: temporary_attendees_secret_mapping with ID ${tempAttendeeSecretString} has no corresponding temporary attendee object.`
			);
			throw error(500, 'Internal server error.');
		}

		const bonfireId = temporaryAttendee.event_id;

		await checkEventIsOpenForNewGoingAttendees(triplitHttpClient, bonfireId, rsvpStatus);

		// Update the RSVP status for the attendee
		const preUpdateTemporaryAttendance = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('temporary_attendees').Where(['id', '=', temporaryAttendee.id])
		);
		if (!preUpdateTemporaryAttendance) {
			throw new Error('cannot update a non-existent temporary attendee');
		}
		if (
			preUpdateTemporaryAttendance.status == rsvpStatus &&
			preUpdateTemporaryAttendance.guest_count == numGuestsCurrentAttendeeIsBringing
		) {
			return new Response(null, { status: 204 });
		}

		// Update the RSVP status for the attendee
		await triplitHttpClient.update('temporary_attendees', temporaryAttendee.id, async (entity) => {
			entity.status = rsvpStatus;
			entity.guest_count = numGuestsCurrentAttendeeIsBringing;
		});

		const update: TemporaryAttendeeChange = {
			temporary_attendee_id: temporaryAttendee.id,
			changed_by: temporaryAttendee.id,
			changed_by_id_type: HistoryChangesConstants.temporary_attendee_id,
			change_type: HistoryChangesConstants.change_update
		};
		// Status was changed
		if (preUpdateTemporaryAttendance.status != rsvpStatus) {
			update.field_name = HistoryChangesConstants.field_name_status;
			update.old_value = preUpdateTemporaryAttendance.status;
			update.new_value = rsvpStatus;
		}
		// Number of guests was changed
		if (preUpdateTemporaryAttendance.guest_count != numGuestsCurrentAttendeeIsBringing) {
			update.field_name = HistoryChangesConstants.field_name_num_guests;
			update.old_value = preUpdateTemporaryAttendance.guest_count?.toString();
			update.new_value = numGuestsCurrentAttendeeIsBringing.toString();
		}
		// Create historical entry
		await triplitHttpClient.insert('temporary_attendees_changes', update);

		// Update the normalized event counts
		const deltas = createAttendeeCountDeltas(
			preUpdateTemporaryAttendance?.status as Status,
			rsvpStatus as Status,
			preUpdateTemporaryAttendance?.guest_count,
			numGuestsCurrentAttendeeIsBringing,
			true
		);
		await upsertEventsPrivateData(triplitHttpClient, bonfireId, deltas);

		// await triplitHttpClient.insert('temporary_attendees_changes', {
		// 	temporary_attendee_id: temporaryAttendee.id,
		// 	changed_by: temporaryAttendee.id,
		// 	changed_by_id_type: HistoryChangesConstants.temporary_attendee_id,
		// 	change_type: HistoryChangesConstants.change_update
		// });

		// Optionally notify of status change
		if (NOTIFY_OF_ATTENDING_STATUS_CHANGE.includes(rsvpStatus)) {
			try {
				await createNewTemporaryAttendanceNotificationQueueObject(
					triplitHttpClient,
					temporaryAttendee.id as string,
					bonfireId,
					[temporaryAttendee.id as string]
				);
			} catch (notificationError) {
				console.error(
					'Failed to create attendance notifications:',
					temporaryAttendee.id,
					rsvpStatus,
					notificationError
				);
			}
		}

		return new Response(null, { status: 204 });
	} catch (err) {
		// Catch unexpected errors and throw a server error
		console.error('Error in POST /attendance:', err);
		throw error(500, 'An unexpected error occurred.');
	}
};
