import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { isOwnerOrAdmin } from '$lib/auth';
import { createUserAttendance } from '$lib/rsvp';
import { Status, NotificationType } from '$lib/enums';
import { and } from '@triplit/client';

export const POST = async ({ request, params, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const eventId = params.eventId;
	if (!eventId) {
		return json({ error: 'Event ID is required' }, { status: 400 });
	}

	// Verify admin permissions
	if (!(await isOwnerOrAdmin(user.id, eventId))) {
		return json({ error: 'Not authorized to invite users to this event' }, { status: 403 });
	}

	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { userId: targetUserId } = requestBody;

	if (!targetUserId) {
		return json({ error: 'Target user ID is required' }, { status: 400 });
	}

	try {
		// Check if user is already an attendee
		const existingAttendance = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('attendees').Where([
				and([
					['user_id', '=', targetUserId],
					['event_id', '=', eventId]
				])
			])
		);

		if (existingAttendance) {
			return json({ error: 'User is already an attendee of this event' }, { status: 400 });
		}

		// Verify target user exists
		const targetUser = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('user').Where(['id', '=', targetUserId])
		);

		if (!targetUser) {
			return json({ error: 'Target user not found' }, { status: 404 });
		}

		// Create attendance record with INVITED status
		const attendance = await createUserAttendance(
			triplitHttpClient,
			targetUserId,
			eventId,
			Status.INVITED,
			0 // No guests for invitations
		);

		// Create invitation notification
		await triplitHttpClient.insert('notifications_queue', {
			user_id: user.id, // User who sent the invitation
			event_id: eventId,
			object_type: NotificationType.EVENT_INVITATION,
			object_ids: JSON.stringify([targetUserId]), // User being invited
			object_ids_set: new Set([targetUserId])
		});

		return json({
			success: true,
			attendance: {
				id: attendance.id,
				user_id: targetUserId,
				event_id: eventId,
				status: Status.INVITED
			}
		});
	} catch (error) {
		console.error('Error inviting user to event:', error);
		return json({ error: 'Failed to invite user' }, { status: 500 });
	}
};
