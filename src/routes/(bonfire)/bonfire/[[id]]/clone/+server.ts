import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triplitHttpClient } from '$lib/server/triplit';
import { generateId } from 'lucia';
import { createUserAttendance } from '$lib/rsvp';
import { Status } from '$lib/enums';
import { createNewEventInvitationNotificationQueueObject } from '$lib/notification_queue';

const BATCH_SIZE = 250; // Process max 100 records at a time

// Helper function to perform bulk insert using Triplit client with fallback
async function bulkInsert(data: Record<string, any[]>) {
	try {
		console.log(`Attempting bulk insert for collections:`, Object.keys(data));
		console.log(
			`Record counts:`,
			Object.entries(data).map(([key, arr]) => `${key}: ${arr.length}`)
		);

		// Sample the first record of each collection for debugging
		for (const [collection, records] of Object.entries(data)) {
			if (records.length > 0) {
				console.log(`Sample ${collection} record:`, JSON.stringify(records[0], null, 2));
			}
		}

		// Use the Triplit client's bulkInsert method
		const result = await triplitHttpClient.bulkInsert(data);
		console.log('Bulk insert completed successfully');
		return result;
	} catch (error) {
		console.error('Bulk insert error, falling back to individual inserts:', error);

		// Fallback to individual inserts
		for (const [collection, records] of Object.entries(data)) {
			console.log(
				`Falling back to individual inserts for ${collection} (${records.length} records)`
			);
			for (const record of records) {
				try {
					await triplitHttpClient.insert(collection, record);
				} catch (insertError) {
					console.error(`Failed to insert individual record in ${collection}:`, insertError);
					throw insertError;
				}
			}
		}

		console.log('Fallback to individual inserts completed successfully');
	}
}

export const POST: RequestHandler = async ({ params, locals, request }) => {
	// Check if user is authenticated
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const eventId = params.id;
	if (!eventId) {
		throw error(400, 'Event ID is required');
	}

	const userId = locals.user.id;

	try {
		// Fetch the original event
		const originalEvent = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('events').Where([['id', '=', eventId]])
		);

		if (!originalEvent) {
			throw error(404, 'Event not found');
		}

		// Check if user is admin or creator of the original event
		const isCreator = originalEvent.user_id === userId;
		const adminCheck = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('event_admins').Where([
				['event_id', '=', eventId],
				['user_id', '=', userId]
			])
		);
		const isAdmin = !!adminCheck;

		if (!isCreator && !isAdmin) {
			throw error(403, 'Only event creators and admins can clone events');
		}

		// Generate new event ID
		const newEventId = generateId(20);

		// Get clone options from request body
		const body = await request.json();
		const cloneName = body.cloneName || `${originalEvent.title} (Copy)`;
		const copyAttendees = body.copyAttendees || false;
		const copyBringList = body.copyBringList || false;

		// Create cloned event with new ID and modified title
		const clonedEventData = {
			id: newEventId,
			title: cloneName,
			description: originalEvent.description,
			start_time: originalEvent.start_time,
			end_time: originalEvent.end_time,
			location: originalEvent.location,
			geocoded_location: originalEvent.geocoded_location,
			latitude: originalEvent.latitude,
			longitude: originalEvent.longitude,
			user_id: userId, // Set current user as creator
			max_num_guests_per_attendee: originalEvent.max_num_guests_per_attendee,
			require_guest_bring_item: originalEvent.require_guest_bring_item,
			non_profit_id: originalEvent.non_profit_id,
			style: originalEvent.style,
			overlay_color: originalEvent.overlay_color,
			overlay_opacity: originalEvent.overlay_opacity,
			font: originalEvent.font,
			max_capacity: originalEvent.max_capacity,
			is_bring_list_enabled: originalEvent.is_bring_list_enabled,
			is_gallery_enabled: originalEvent.is_gallery_enabled,
			is_messaging_enabled: originalEvent.is_messaging_enabled,
			is_cut_off_date_enabled: originalEvent.is_cut_off_date_enabled,
			cut_off_date: originalEvent.cut_off_date,
			is_published: false, // Cloned events start as drafts
			isReal: originalEvent.isReal,
			created_at: new Date()
		};

		// Insert the cloned event
		const clonedEvent = await triplitHttpClient.insert('events', clonedEventData);

		// Add the cloning user as the first attendee with GOING status
		await createUserAttendance(triplitHttpClient, userId, newEventId, 'going', 0);

		// Clone attendees if requested
		if (copyAttendees) {
			console.log('Starting attendee cloning process...');

			// Track user IDs for notifications (both regular and temp attendees)
			const invitedUserIds: string[] = [];

			// Fetch permanent attendees in paginated batches
			let hasMoreAttendees = true;
			let lastAttendeeId = '';

			while (hasMoreAttendees) {
				let query = triplitHttpClient
					.query('attendees')
					.Where([['event_id', '=', eventId]])
					.Limit(BATCH_SIZE);

				// Add cursor for pagination if we have a last ID
				if (lastAttendeeId) {
					query = query.Where([['id', '>', lastAttendeeId]]);
				}

				const attendees = await triplitHttpClient.fetch(query);

				if (attendees.length === 0) {
					hasMoreAttendees = false;
					break;
				}

				// Filter out the creator (already added) and prepare data
				const attendeesToClone = attendees
					.filter((attendee) => attendee.user_id !== userId)
					.map((attendee) => {
						const newAttendeeId = `at_${newEventId}-${attendee.user_id}`;
						invitedUserIds.push(attendee.user_id); // Track user ID for notifications
						return {
							id: newAttendeeId,
							event_id: newEventId,
							user_id: attendee.user_id,
							status: Status.INVITED,
							guest_count: attendee.guest_count,
							updated_at: new Date()
						};
					});

				if (attendeesToClone.length > 0) {
					await bulkInsert({ attendees: attendeesToClone });
					console.log(`Cloned ${attendeesToClone.length} permanent attendees with INVITED status`);
				}

				// Update cursor for next iteration
				lastAttendeeId = attendees[attendees.length - 1].id;
				hasMoreAttendees = attendees.length === BATCH_SIZE;
			}

			// Fetch temporary attendees in paginated batches (don't track for notifications since they have no user accounts)
			let hasMoreTempAttendees = true;
			let lastTempAttendeeId = '';

			while (hasMoreTempAttendees) {
				let query = triplitHttpClient
					.query('temporary_attendees')
					.Where([['event_id', '=', eventId]])
					.Limit(BATCH_SIZE);

				// Add cursor for pagination if we have a last ID
				if (lastTempAttendeeId) {
					query = query.Where([['id', '>', lastTempAttendeeId]]);
				}

				const tempAttendees = await triplitHttpClient.fetch(query);

				if (tempAttendees.length === 0) {
					hasMoreTempAttendees = false;
					break;
				}

				// Prepare bulk data for temp attendees and their secret mappings
				const tempAttendeesToClone = [];
				const secretMappingsToClone = [];

				for (const tempAttendee of tempAttendees) {
					const newTempId = generateId(15);

					tempAttendeesToClone.push({
						id: newTempId,
						event_id: newEventId,
						status: Status.INVITED,
						name: tempAttendee.name,
						guest_count: tempAttendee.guest_count,
						updated_at: new Date()
					});

					// Check for secret mapping
					const secretMapping = await triplitHttpClient.fetchOne(
						triplitHttpClient
							.query('temporary_attendees_secret_mapping')
							.Where([['temporary_attendee_id', '=', tempAttendee.id]])
					);

					if (secretMapping) {
						secretMappingsToClone.push({
							id: generateId(25),
							temporary_attendee_id: newTempId,
							created_at: new Date()
						});
					}
				}

				// Bulk insert temp attendees and their mappings
				const bulkData: Record<string, any[]> = {
					temporary_attendees: tempAttendeesToClone
				};

				if (secretMappingsToClone.length > 0) {
					bulkData.temporary_attendees_secret_mapping = secretMappingsToClone;
				}

				await bulkInsert(bulkData);
				console.log(
					`Cloned ${tempAttendeesToClone.length} temporary attendees with INVITED status and ${secretMappingsToClone.length} secret mappings`
				);

				// Update cursor for next iteration
				lastTempAttendeeId = tempAttendees[tempAttendees.length - 1].id;
				hasMoreTempAttendees = tempAttendees.length === BATCH_SIZE;
			}

			// Clone events_private_data to maintain normalized counts
			const eventsPrivateData = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('events_private_data').Where([['event_id', '=', eventId]])
			);

			if (eventsPrivateData) {
				await triplitHttpClient.insert('events_private_data', {
					id: `epd_${newEventId}`,
					event_id: newEventId,
					num_attendees_going: eventsPrivateData.num_attendees_going || 0,
					num_attendees_not_going: eventsPrivateData.num_attendees_not_going || 0,
					num_attendees_maybe: eventsPrivateData.num_attendees_maybe || 0,
					num_attendees_waitlisted: eventsPrivateData.num_attendees_waitlisted || 0,
					num_attendees_left: eventsPrivateData.num_attendees_left || 0,
					num_attendees_removed: eventsPrivateData.num_attendees_removed || 0,
					num_temp_attendees_going: eventsPrivateData.num_temp_attendees_going || 0,
					num_temp_attendees_not_going: eventsPrivateData.num_temp_attendees_not_going || 0,
					num_temp_attendees_maybe: eventsPrivateData.num_temp_attendees_maybe || 0,
					num_temp_attendees_waitlisted: eventsPrivateData.num_temp_attendees_waitlisted || 0,
					num_temp_attendees_left: eventsPrivateData.num_temp_attendees_left || 0,
					num_temp_attendees_removed: eventsPrivateData.num_temp_attendees_removed || 0
				});
			}

			// Create notification queue for invited users
			if (invitedUserIds.length > 0) {
				await createNewEventInvitationNotificationQueueObject(
					triplitHttpClient,
					userId,
					newEventId,
					invitedUserIds
				);
				console.log(`Created invitation notifications for ${invitedUserIds.length} users`);
			}
		}

		// Clone bring list items if enabled and requested
		if (originalEvent.is_bring_list_enabled && copyBringList) {
			console.log('Starting bring list cloning process...');

			// Fetch bring items in paginated batches
			let hasMoreItems = true;
			let lastItemId = '';

			while (hasMoreItems) {
				let query = triplitHttpClient
					.query('bring_items')
					.Where([['event_id', '=', eventId]])
					.Limit(BATCH_SIZE);

				// Add cursor for pagination if we have a last ID
				if (lastItemId) {
					query = query.Where([['id', '>', lastItemId]]);
				}

				const bringItems = await triplitHttpClient.fetch(query);

				if (bringItems.length === 0) {
					hasMoreItems = false;
					break;
				}

				// Prepare bulk data for bring items
				const itemsToClone = bringItems.map((item) => ({
					id: generateId(15),
					event_id: newEventId,
					name: item.name,
					unit: item.unit,
					quantity_needed: item.quantity_needed,
					details: item.details,
					created_by_user_id: userId,
					created_at: new Date()
				}));

				await bulkInsert({ bring_items: itemsToClone });
				console.log(`Cloned ${itemsToClone.length} bring list items`);

				// Update cursor for next iteration
				lastItemId = bringItems[bringItems.length - 1].id;
				hasMoreItems = bringItems.length === BATCH_SIZE;
			}
		}

		// Clone banner media if it exists
		const bannerMedia = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('banner_media').Where([['event_id', '=', eventId]])
		);

		if (bannerMedia) {
			await triplitHttpClient.insert('banner_media', {
				id: generateId(15),
				full_image_key: bannerMedia.full_image_key,
				small_image_key: bannerMedia.small_image_key,
				file_type: bannerMedia.file_type,
				h_pixel_lg: bannerMedia.h_pixel_lg,
				w_pixel_lg: bannerMedia.w_pixel_lg,
				h_pixel_sm: bannerMedia.h_pixel_sm,
				w_pixel_sm: bannerMedia.w_pixel_sm,
				blurr_hash: bannerMedia.blurr_hash,
				size_in_bytes: bannerMedia.size_in_bytes,
				unsplash_author_name: bannerMedia.unsplash_author_name,
				unsplash_author_username: bannerMedia.unsplash_author_username,
				uploaded_at: new Date(),
				uploader_id: userId, // Set current user as uploader
				event_id: newEventId
			});
		}

		// Clone event reminders (typically small number, but use pagination for consistency)
		console.log('Starting event reminders cloning process...');
		let hasMoreReminders = true;
		let lastReminderId = '';

		while (hasMoreReminders) {
			let query = triplitHttpClient
				.query('event_reminders')
				.Where([['event_id', '=', eventId]])
				.Limit(BATCH_SIZE);

			// Add cursor for pagination if we have a last ID
			if (lastReminderId) {
				query = query.Where([['id', '>', lastReminderId]]);
			}

			const reminders = await triplitHttpClient.fetch(query);

			if (reminders.length === 0) {
				hasMoreReminders = false;
				break;
			}

			// Prepare bulk data for reminders
			const remindersToClone = reminders.map((reminder) => {
				// Calculate new send_at time based on the cloned event's start time
				const leadTimeMs = reminder.lead_time_in_hours_before_event_starts * 60 * 60 * 1000;
				const newSendAt = new Date(clonedEvent.start_time.getTime() - leadTimeMs);

				return {
					id: generateId(15),
					event_id: newEventId,
					text: reminder.text,
					lead_time_in_hours_before_event_starts: reminder.lead_time_in_hours_before_event_starts,
					target_attendee_statuses: reminder.target_attendee_statuses,
					send_at: newSendAt,
					sent_at: null,
					created_at: new Date(),
					updated_at: new Date(),
					dropped: false
				};
			});

			await bulkInsert({ event_reminders: remindersToClone });
			console.log(`Cloned ${remindersToClone.length} event reminders`);

			// Update cursor for next iteration
			lastReminderId = reminders[reminders.length - 1].id;
			hasMoreReminders = reminders.length === BATCH_SIZE;
		}

		console.log(`Event ${eventId} cloned to ${newEventId} by user ${userId}`);

		return json({
			success: true,
			clonedEventId: newEventId,
			clonedEvent: clonedEvent
		});
	} catch (err) {
		console.error('Error cloning event:', err);
		throw error(500, 'Failed to clone event');
	}
};
