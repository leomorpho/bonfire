import { error, type RequestHandler } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { NOTIFY_OF_ATTENDING_STATUS_CHANGE, tempAttendeeSecretParam } from '$lib/enums';
import { createNewTemporaryAttendanceNotificationQueueObject } from '$lib/notification';
import { checkEventIsOpenForNewGoingAttendees } from '$lib/triplit';

export const POST: RequestHandler = async ({ url, request }): Promise<Response> => {
	try {
		const tempAttendeeSecretString = url.searchParams.get(tempAttendeeSecretParam);

		if (!tempAttendeeSecretString) {
			throw error(400, 'No temporary attendee secret provided.');
		}

		const { rsvpStatus, numGuests } = await request.json();
		if (!rsvpStatus) {
			throw error(400, 'RSVP status is required.');
		}

		const tempAttendeeSecret = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('temporary_attendees_secret_mapping')
				.where(['id', '=', tempAttendeeSecretString])
				.include('temporary_attendee')
				.build()
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

		let newNumGuest = attendance.guest_count;
		if (numGuests !== null && Number.isInteger(numGuests)) {
			newNumGuest = numGuests;
		}

		// Update the RSVP status for the attendee
		await triplitHttpClient.update('temporary_attendees', temporaryAttendee.id, async (entity) => {
			entity.status = rsvpStatus;
			entity.guest_count = newNumGuest;
		});

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
