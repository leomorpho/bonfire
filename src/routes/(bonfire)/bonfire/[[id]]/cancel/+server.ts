import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triplitHttpClient } from '$lib/server/triplit';
import { createNewEventCancelledNotificationQueueObject } from '$lib/notification_queue';
import { Status, EventStatus } from '$lib/enums';

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

		// Verify the user is the event creator or an admin
		const event = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('events')
				.Where([['id', '=', eventId]])
				.Select(['user_id'])
		);

		if (!event || event.length === 0) {
			return json({ error: 'Event not found' }, { status: 404 });
		}

		const eventCreatorId = event[0].user_id;

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
			return json({ error: 'Not authorized to cancel this event' }, { status: 403 });
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
		const totalAttendees = regularAttendeeIds.length + tempAttendeeIds.length;

		// Filter out the current user from regular attendees for notification purposes
		const otherRegularAttendeeIds = regularAttendeeIds.filter((id) => id !== user.id);
		const hasOtherAttendees = otherRegularAttendeeIds.length > 0 || tempAttendeeIds.length > 0;

		// If no other attendees (only current user or no attendees), delete the event and all associated data
		if (!hasOtherAttendees) {
			// Delete associated data first
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
						Promise.all(
							announcements.map((ann) => triplitHttpClient.delete('announcement', ann.id))
						)
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
						Promise.all(
							banners.map((banner) => triplitHttpClient.delete('banner_media', banner.id))
						)
					)
			]);

			// Finally delete the event itself
			await triplitHttpClient.delete('events', eventId);

			return json({
				deleted: true,
				message: 'Event deleted successfully (no attendees to notify)'
			});
		}

		// If there are other attendees, create notification queue entries and mark as cancelled
		if (otherRegularAttendeeIds.length > 0) {
			await createNewEventCancelledNotificationQueueObject(
				triplitHttpClient,
				user.id,
				eventId,
				otherRegularAttendeeIds
			);
		}

		// Mark event as cancelled instead of deleting it
		await triplitHttpClient.update('events', eventId, async (entity) => {
			entity.status = EventStatus.CANCELLED;
		});

		return json({
			cancelled: true,
			attendeesNotified: otherRegularAttendeeIds.length,
			message: !hasOtherAttendees
				? 'Event cancelled successfully (no other attendees to notify)'
				: `Event cancelled successfully. ${otherRegularAttendeeIds.length} attendees will be notified.`
		});
	} catch (error) {
		console.error('Error cancelling event:', error);
		return json({ error: 'Failed to cancel event' }, { status: 500 });
	}
};
