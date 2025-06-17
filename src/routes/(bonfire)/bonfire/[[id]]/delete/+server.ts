import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triplitHttpClient } from '$lib/server/triplit';
import { createNewEventDeletedNotificationQueueObject } from '$lib/notification_queue';
import { Status } from '$lib/enums';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const eventId = params.id;
		if (!eventId) {
			return json({ error: 'Event ID is required' }, { status: 400 });
		}

		const user = locals.user;
		if (!user) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Parse request body to get confirmation details
		const body = await request.json().catch(() => ({}));
		const { eventName, confirmationName } = body;

		// Verify the user is the event creator or an admin
		const event = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('events')
				.Where([['id', '=', eventId]])
				.Select(['user_id', 'title'])
		);

		if (!event || event.length === 0) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const eventCreatorId = event[0].user_id;
		const eventTitle = event[0].title;

		// Check if user is event creator
		let isAuthorized = user.id === eventCreatorId;

		// If not creator, check if user is an admin
		if (!isAuthorized) {
			const eventAdmin = await triplitHttpClient.fetch(
				triplitHttpClient.query('event_admins').Where([
					['event_id', '=', eventId],
					['user_id', '=', user.id]
				])
			);
			isAuthorized = eventAdmin && eventAdmin.length > 0;
		}

		if (!isAuthorized) {
			return json({ error: 'Not authorized to delete this event' }, { status: 403 });
		}

		// Verify name confirmation if provided
		if (eventName && confirmationName) {
			if (eventName !== confirmationName) {
				return json({ error: 'Event name confirmation does not match' }, { status: 400 });
			}
			
			if (eventTitle !== eventName) {
				return json({ error: 'Provided event name does not match the actual event name' }, { status: 400 });
			}
		}

		// Get all attendees (regular and temporary) to notify
		const [regularAttendees, tempAttendees] = await Promise.all([
			triplitHttpClient.fetch(
				triplitHttpClient
					.query('attendees')
					.Where([
						['event_id', '=', eventId],
						['status', 'in', [Status.GOING, Status.MAYBE, Status.INVITED]]
					])
					.Select(['user_id'])
			),
			triplitHttpClient.fetch(
				triplitHttpClient
					.query('temporary_attendees')
					.Where([
						['event_id', '=', eventId],
						['status', 'in', [Status.GOING, Status.MAYBE, Status.INVITED]]
					])
					.Select(['id'])
			)
		]);

		const regularAttendeeIds = regularAttendees.map((attendee) => attendee.user_id);
		const tempAttendeeIds = tempAttendees.map((attendee) => attendee.id);

		// Filter out the current user from regular attendees for notification purposes
		const otherRegularAttendeeIds = regularAttendeeIds.filter((id) => id !== user.id);

		// Create notifications for other attendees before deleting the event
		if (otherRegularAttendeeIds.length > 0) {
			await createNewEventDeletedNotificationQueueObject(
				triplitHttpClient,
				user.id,
				eventId,
				otherRegularAttendeeIds
			);
		}

		// Delete all associated data first
		await Promise.all([
			// Delete event admins
			triplitHttpClient
				.fetch(triplitHttpClient.query('event_admins').Where([['event_id', '=', eventId]]))
				.then((admins) =>
					Promise.all(admins.map((admin) => triplitHttpClient.delete('event_admins', admin.id)))
				),
			// Delete announcements
			triplitHttpClient
				.fetch(triplitHttpClient.query('announcement').Where([['event_id', '=', eventId]]))
				.then((announcements) =>
					Promise.all(announcements.map((ann) => triplitHttpClient.delete('announcement', ann.id)))
				),
			// Delete bring items and assignments
			triplitHttpClient
				.fetch(triplitHttpClient.query('bring_items').Where([['event_id', '=', eventId]]))
				.then((items) =>
					Promise.all(
						items.map(async (item) => {
							// Delete bring assignments first
							const assignments = await triplitHttpClient.fetch(
								triplitHttpClient
									.query('bring_assignments')
									.Where([['bring_item_id', '=', item.id]])
							);
							await Promise.all(
								assignments.map((assignment) =>
									triplitHttpClient.delete('bring_assignments', assignment.id)
								)
							);
							// Then delete the bring item
							await triplitHttpClient.delete('bring_items', item.id);
						})
					)
				),
			// Delete event threads and messages
			triplitHttpClient
				.fetch(triplitHttpClient.query('event_threads').Where([['event_id', '=', eventId]]))
				.then((threads) =>
					Promise.all(
						threads.map(async (thread) => {
							// Delete messages first
							const messages = await triplitHttpClient.fetch(
								triplitHttpClient.query('event_messages').Where([['thread_id', '=', thread.id]])
							);
							await Promise.all(
								messages.map((msg) => triplitHttpClient.delete('event_messages', msg.id))
							);
							// Then delete the thread
							await triplitHttpClient.delete('event_threads', thread.id);
						})
					)
				),
			// Delete files
			triplitHttpClient
				.fetch(triplitHttpClient.query('files').Where([['event_id', '=', eventId]]))
				.then((files) =>
					Promise.all(files.map((file) => triplitHttpClient.delete('files', file.id)))
				),
			// Delete event reminders
			triplitHttpClient
				.fetch(triplitHttpClient.query('event_reminders').Where([['event_id', '=', eventId]]))
				.then((reminders) =>
					Promise.all(
						reminders.map((reminder) => triplitHttpClient.delete('event_reminders', reminder.id))
					)
				),
			// Delete event private data
			triplitHttpClient
				.fetch(triplitHttpClient.query('events_private_data').Where([['event_id', '=', eventId]]))
				.then((privateData) =>
					Promise.all(
						privateData.map((data) => triplitHttpClient.delete('events_private_data', data.id))
					)
				),
			// Delete banner media
			triplitHttpClient
				.fetch(triplitHttpClient.query('banner_media').Where([['event_id', '=', eventId]]))
				.then((banners) =>
					Promise.all(banners.map((banner) => triplitHttpClient.delete('banner_media', banner.id)))
				),
			// Delete attendees
			triplitHttpClient
				.fetch(triplitHttpClient.query('attendees').Where([['event_id', '=', eventId]]))
				.then((attendees) =>
					Promise.all(
						attendees.map((attendee) => triplitHttpClient.delete('attendees', attendee.id))
					)
				),
			// Delete temporary attendees
			triplitHttpClient
				.fetch(triplitHttpClient.query('temporary_attendees').Where([['event_id', '=', eventId]]))
				.then((tempAttendees) =>
					Promise.all(
						tempAttendees.map((tempAttendee) =>
							triplitHttpClient.delete('temporary_attendees', tempAttendee.id)
						)
					)
				)
		]);

		// Finally delete the event itself
		await triplitHttpClient.delete('events', eventId);

		return json({
			deleted: true,
			attendeesNotified: otherRegularAttendeeIds.length,
			message: `Event "${eventTitle}" deleted successfully. ${otherRegularAttendeeIds.length} attendees will be notified.`
		});
	} catch (error) {
		console.error('Error deleting event:', error);
		return json({ error: 'Failed to delete event' }, { status: 500 });
	}
};
