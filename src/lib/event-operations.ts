import type { TriplitClient } from '@triplit/client';
import { waitForUserId } from '$lib/triplit';
import { addGroupAdminsToNewEvent } from '$lib/groups';
import { upsertUserAttendance } from '$lib/rsvp';
import { Status } from '$lib/enums';

export interface CreateEventData {
	title: string;
	description?: string;
	location?: string;
	geocoded_location?: any;
	start_time: Date;
	end_time?: Date | null;
	group_id?: string | null;
	style?: string;
	overlay_color?: string;
	overlay_opacity?: number;
	font?: any;
	max_capacity?: number | null;
	max_num_guests_per_attendee?: number;
	is_bring_list_enabled?: boolean;
	is_gallery_enabled?: boolean;
	is_messaging_enabled?: boolean;
	require_guest_bring_item?: boolean;
	is_cut_off_date_enabled?: boolean;
	cut_off_date?: Date | null;
	is_ticketed?: boolean;
	max_tickets_per_user?: number | null;
	ticket_currency?: string;
	latitude?: number | null;
	longitude?: number | null;
}

export interface UpdateEventData extends Partial<CreateEventData> {
	is_published?: boolean;
}

function generateSecureId(length = 12) {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % charactersLength);
	}
	return result;
}

/**
 * Creates a new event using the provided Triplit client
 * Extracted from EventForm.svelte
 */
export async function createEvent(
	client: TriplitClient,
	eventData: CreateEventData
): Promise<{ event: any; eventId: string }> {
	const userId = await waitForUserId();
	if (!userId) {
		throw new Error('User authentication failed');
	}

	const eventId = await generateSecureId(20);

	const fullEventData = {
		id: eventId,
		title: eventData.title || '',
		description: eventData.description || '',
		location: eventData.location || '',
		geocoded_location: eventData.geocoded_location
			? JSON.stringify(eventData.geocoded_location)
			: null,
		start_time: eventData.start_time,
		end_time: eventData.end_time,
		user_id: userId,
		group_id: eventData.group_id || null,
		style: eventData.style || '',
		overlay_color: eventData.overlay_color || '#000000',
		overlay_opacity: eventData.overlay_opacity || 0.4,
		font: eventData.font ? JSON.stringify(eventData.font) : null,
		max_capacity: eventData.max_capacity || null,
		max_num_guests_per_attendee: eventData.is_ticketed
			? 0
			: eventData.max_num_guests_per_attendee || 0,
		is_bring_list_enabled: eventData.is_bring_list_enabled || false,
		is_gallery_enabled: eventData.is_gallery_enabled ?? true,
		is_messaging_enabled: eventData.is_messaging_enabled ?? true,
		require_guest_bring_item: eventData.require_guest_bring_item || false,
		is_cut_off_date_enabled: eventData.is_cut_off_date_enabled || false,
		cut_off_date: eventData.cut_off_date || null,
		// Ticketing fields
		is_ticketed: eventData.is_ticketed || false,
		max_tickets_per_user: eventData.is_ticketed ? eventData.max_tickets_per_user : null,
		ticket_currency: eventData.is_ticketed ? eventData.ticket_currency : 'usd',
		latitude: eventData.latitude || null,
		longitude: eventData.longitude || null
	};

	console.log('🔍 Event Data being sent to insert:', JSON.stringify(fullEventData, null, 2));

	const event = await client.http.insert('events', fullEventData);

	// If event is part of a group, add all group admins as event admins
	if (eventData.group_id) {
		await addGroupAdminsToNewEvent(client, eventId, eventData.group_id, userId);
	}

	// Add user as attendee
	await upsertUserAttendance(eventId, Status.GOING, 0);

	console.log('✅ Event created successfully');

	return { event, eventId };
}

/**
 * Updates an existing event using the provided Triplit client
 * Extracted from EventForm.svelte
 */
export async function updateEvent(
	client: TriplitClient,
	eventId: string,
	eventData: UpdateEventData
): Promise<void> {
	await client.http.update('events', eventId, async (e: any) => {
		if (eventData.title !== undefined) e.title = eventData.title;
		if (eventData.description !== undefined) e.description = eventData.description || null;
		if (eventData.location !== undefined) e.location = eventData.location;
		if (eventData.geocoded_location !== undefined) {
			e.geocoded_location = eventData.geocoded_location
				? JSON.stringify(eventData.geocoded_location)
				: null;
		}
		if (eventData.start_time !== undefined) e.start_time = eventData.start_time?.toISOString();
		if (eventData.end_time !== undefined) e.end_time = eventData.end_time?.toISOString();
		if (eventData.group_id !== undefined)
			e.group_id = eventData.group_id || null;
		if (eventData.style !== undefined) e.style = eventData.style;
		if (eventData.overlay_color !== undefined) e.overlay_color = eventData.overlay_color;
		if (eventData.overlay_opacity !== undefined) e.overlay_opacity = eventData.overlay_opacity;
		if (eventData.font !== undefined)
			e.font = eventData.font ? JSON.stringify(eventData.font) : null;
		if (eventData.max_capacity !== undefined) e.max_capacity = eventData.max_capacity;
		if (eventData.max_num_guests_per_attendee !== undefined) {
			e.max_num_guests_per_attendee = eventData.is_ticketed
				? 0
				: eventData.max_num_guests_per_attendee || 0;
		}
		if (eventData.is_bring_list_enabled !== undefined)
			e.is_bring_list_enabled = eventData.is_bring_list_enabled || false;
		if (eventData.is_gallery_enabled !== undefined)
			e.is_gallery_enabled = eventData.is_gallery_enabled;
		if (eventData.is_messaging_enabled !== undefined)
			e.is_messaging_enabled = eventData.is_messaging_enabled;
		if (eventData.require_guest_bring_item !== undefined)
			e.require_guest_bring_item = eventData.require_guest_bring_item;
		if (eventData.is_cut_off_date_enabled !== undefined)
			e.is_cut_off_date_enabled = eventData.is_cut_off_date_enabled;
		if (eventData.cut_off_date !== undefined) e.cut_off_date = eventData.cut_off_date;
		// Ticketing fields
		if (eventData.is_ticketed !== undefined) e.is_ticketed = eventData.is_ticketed || false;
		if (eventData.max_tickets_per_user !== undefined) {
			e.max_tickets_per_user = eventData.is_ticketed ? eventData.max_tickets_per_user : null;
		}
		if (eventData.ticket_currency !== undefined) {
			e.ticket_currency = eventData.is_ticketed ? eventData.ticket_currency : 'usd';
		}
		if (eventData.latitude !== undefined) e.latitude = eventData.latitude;
		if (eventData.longitude !== undefined) e.longitude = eventData.longitude;
		if (eventData.is_published !== undefined) e.is_published = eventData.is_published;
	});

	console.log('🔄 Event updated successfully');
}

// Function to trigger the updateRemindersObjects endpoint
export async function triggerUpdateReminders(eventId: string) {
	try {
		const response = await fetch(`/bonfire/${eventId}/update/reminders`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to trigger update');
		}

		const data = await response.json();
		console.log('Update triggered successfully:', data);
		return data;
	} catch (error) {
		console.error('Error triggering update:', error);
		throw error;
	}
}
