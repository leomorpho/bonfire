import { and, type TriplitClient } from '@triplit/client';
import {
	HistoryChangesConstants,
	NOTIFY_OF_ATTENDING_STATUS_CHANGE,
	Status,
	tempAttendeeSecretParam
} from './enums';
import { createNewAttendanceNotificationQueueObject } from './notification';

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

		if (NOTIFY_OF_ATTENDING_STATUS_CHANGE.includes(prevStatus as Status)) {
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
