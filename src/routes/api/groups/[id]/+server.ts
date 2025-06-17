import { json, error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export async function DELETE({ params, request, locals }) {
	const { id } = params;

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!id) {
		throw error(400, 'Group ID is required');
	}

	const client = triplitHttpClient;

	try {
		// Parse request body to get deletion options and confirmation
		const { groupName, confirmationName, deleteEvents = false } = await request.json();

		// Verify group exists
		const group = await client.fetchOne(
			client.query('groups').Where([['id', '=', id]])
		);

		if (!group) {
			throw error(404, 'Group not found');
		}

		// Check permissions - only creator can delete the group
		const isCreator = group.created_by_user_id === locals.user.id;

		if (!isCreator) {
			throw error(403, 'Only the group creator can delete the group');
		}

		// Verify the name confirmation matches
		if (groupName !== confirmationName) {
			throw error(400, 'Group name confirmation does not match');
		}

		// Verify the provided name matches the actual group name
		if (group.name !== groupName) {
			throw error(400, 'Provided group name does not match the actual group name');
		}

		// Get all events in this group
		const groupEvents = await client.fetch(
			client.query('events').Where([['group_id', '=', id]])
		);

		if (deleteEvents) {
			// Delete all events and their associated data
			for (const event of groupEvents) {
				// Delete all event-related data (similar to event deletion endpoint)
				
				// Delete attendees
				const attendees = await client.fetch(
					client.query('attendees').Where([['event_id', '=', event.id]])
				);
				for (const attendee of attendees) {
					await client.delete('attendees', attendee.id);
				}

				// Delete temporary attendees
				const tempAttendees = await client.fetch(
					client.query('temporary_attendees').Where([['event_id', '=', event.id]])
				);
				for (const tempAttendee of tempAttendees) {
					await client.delete('temporary_attendees', tempAttendee.id);
				}

				// Delete event admins
				const eventAdmins = await client.fetch(
					client.query('event_admins').Where([['event_id', '=', event.id]])
				);
				for (const admin of eventAdmins) {
					await client.delete('event_admins', admin.id);
				}

				// Delete messages
				const messages = await client.fetch(
					client.query('event_messages').Where([['event_id', '=', event.id]])
				);
				for (const message of messages) {
					await client.delete('event_messages', message.id);
				}

				// Delete announcements
				const announcements = await client.fetch(
					client.query('announcement').Where([['event_id', '=', event.id]])
				);
				for (const announcement of announcements) {
					await client.delete('announcement', announcement.id);
				}

				// Delete bring list items
				const bringListItems = await client.fetch(
					client.query('bring_list_items').Where([['event_id', '=', event.id]])
				);
				for (const item of bringListItems) {
					await client.delete('bring_list_items', item.id);
				}

				// Delete files
				const files = await client.fetch(
					client.query('files').Where([['event_id', '=', event.id]])
				);
				for (const file of files) {
					await client.delete('files', file.id);
				}

				// Delete notification permissions
				const notificationPermissions = await client.fetch(
					client.query('notification_permissions').Where([['event_id', '=', event.id]])
				);
				for (const permission of notificationPermissions) {
					await client.delete('notification_permissions', permission.id);
				}

				// Delete tickets
				const tickets = await client.fetch(
					client.query('tickets').Where([['event_id', '=', event.id]])
				);
				for (const ticket of tickets) {
					await client.delete('tickets', ticket.id);
				}

				// Delete the event
				await client.delete('events', event.id);
			}
		} else {
			// Just unlink events from the group (set group_id to null)
			for (const event of groupEvents) {
				await client.update('events', event.id, (eventEntity) => {
					eventEntity.group_id = null;
				});
			}
		}

		// Delete group-related data
		
		// Delete group members
		const groupMembers = await client.fetch(
			client.query('group_members').Where([['group_id', '=', id]])
		);
		for (const member of groupMembers) {
			await client.delete('group_members', member.id);
		}

		// Delete group viewers
		const groupViewers = await client.fetch(
			client.query('group_viewers').Where([['group_id', '=', id]])
		);
		for (const viewer of groupViewers) {
			await client.delete('group_viewers', viewer.id);
		}

		// Delete group join requests
		const joinRequests = await client.fetch(
			client.query('group_join_requests').Where([['group_id', '=', id]])
		);
		for (const request of joinRequests) {
			await client.delete('group_join_requests', request.id);
		}

		// Delete group banner media
		const bannerMedia = await client.fetch(
			client.query('banner_media').Where([['group_id', '=', id]])
		);
		for (const media of bannerMedia) {
			await client.delete('banner_media', media.id);
		}

		// Finally, delete the group
		await client.delete('groups', id);

		const message = deleteEvents 
			? 'Group and all associated events deleted successfully'
			: 'Group deleted successfully (events preserved)';

		return json({ success: true, message });

	} catch (err) {
		console.error('Error deleting group:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to delete group');
	}
}