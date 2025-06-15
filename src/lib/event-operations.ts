import type { TriplitClient } from '@triplit/client';
import { getFeWorkerTriplitClient, waitForUserId } from '$lib/triplit';
import { generatePassphraseId } from '$lib/utils';
import { addOrgAdminsToNewEvent } from '$lib/organizations';
import { upsertUserAttendance } from '$lib/rsvp';
import { Status } from '$lib/enums';

export interface EventData {
	id?: string;
	title: string;
	description?: string;
	location?: string;
	geocoded_location?: any;
	start_time: Date;
	end_time?: Date | null;
	user_id: string;
	organization_id?: string | null;
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
	is_published?: boolean;
}

/**
 * Creates a new event using the provided Triplit client
 */
export async function createEvent(
	client: TriplitClient,
	eventData: Omit<EventData, 'id' | 'user_id'>
): Promise<{ event: any; eventId: string }> {
	const userId = await waitForUserId();
	if (!userId) {
		throw new Error('User authentication failed');
	}

	const eventId = await generatePassphraseId();
	
	const fullEventData = {
		id: eventId,
		user_id: userId,
		is_published: false, // Always start as draft
		// Default values
		style: '',
		overlay_color: '#000000',
		overlay_opacity: 0.4,
		font: null,
		max_num_guests_per_attendee: 0,
		is_bring_list_enabled: false,
		is_gallery_enabled: true,
		is_messaging_enabled: true,
		require_guest_bring_item: false,
		is_cut_off_date_enabled: false,
		is_ticketed: false,
		ticket_currency: 'usd',
		...eventData
	};

	console.log('🔍 Event Data being sent to insert:', JSON.stringify(fullEventData, null, 2));

	const event = await client.http.insert('events', fullEventData);

	// If event is part of an organization, add all org admins as event admins
	if (eventData.organization_id) {
		await addOrgAdminsToNewEvent(client, eventId, eventData.organization_id, userId);
	}

	// Add user as attendee
	await upsertUserAttendance(eventId, Status.GOING, 0);

	console.log('✅ Event created successfully');
	
	return { event, eventId };
}

/**
 * Updates an existing event using the provided Triplit client
 */
export async function updateEvent(
	client: TriplitClient,
	eventId: string,
	eventData: Partial<EventData>
): Promise<void> {
	await client.http.update('events', eventId, async (e: any) => {
		// Only update fields that are provided
		if (eventData.title !== undefined) e.title = eventData.title;
		if (eventData.description !== undefined) e.description = eventData.description || null;
		if (eventData.location !== undefined) e.location = eventData.location;
		if (eventData.geocoded_location !== undefined) {
			e.geocoded_location = eventData.geocoded_location ? JSON.stringify(eventData.geocoded_location) : null;
		}
		if (eventData.start_time !== undefined) e.start_time = eventData.start_time.toISOString();
		if (eventData.end_time !== undefined) {
			e.end_time = eventData.end_time ? eventData.end_time.toISOString() : null;
		}
		if (eventData.organization_id !== undefined) e.organization_id = eventData.organization_id || null;
		if (eventData.style !== undefined) e.style = eventData.style;
		if (eventData.overlay_color !== undefined) e.overlay_color = eventData.overlay_color;
		if (eventData.overlay_opacity !== undefined) e.overlay_opacity = eventData.overlay_opacity;
		if (eventData.font !== undefined) e.font = eventData.font ? JSON.stringify(eventData.font) : null;
		if (eventData.max_capacity !== undefined) e.max_capacity = eventData.max_capacity;
		if (eventData.max_num_guests_per_attendee !== undefined) {
			e.max_num_guests_per_attendee = eventData.max_num_guests_per_attendee;
		}
		if (eventData.is_bring_list_enabled !== undefined) e.is_bring_list_enabled = eventData.is_bring_list_enabled;
		if (eventData.is_gallery_enabled !== undefined) e.is_gallery_enabled = eventData.is_gallery_enabled;
		if (eventData.is_messaging_enabled !== undefined) e.is_messaging_enabled = eventData.is_messaging_enabled;
		if (eventData.require_guest_bring_item !== undefined) e.require_guest_bring_item = eventData.require_guest_bring_item;
		if (eventData.is_cut_off_date_enabled !== undefined) e.is_cut_off_date_enabled = eventData.is_cut_off_date_enabled;
		if (eventData.cut_off_date !== undefined) e.cut_off_date = eventData.cut_off_date;
		if (eventData.is_ticketed !== undefined) e.is_ticketed = eventData.is_ticketed;
		if (eventData.max_tickets_per_user !== undefined) e.max_tickets_per_user = eventData.max_tickets_per_user;
		if (eventData.ticket_currency !== undefined) e.ticket_currency = eventData.ticket_currency;
		if (eventData.latitude !== undefined) e.latitude = eventData.latitude;
		if (eventData.longitude !== undefined) e.longitude = eventData.longitude;
		if (eventData.is_published !== undefined) e.is_published = eventData.is_published;
	});

	console.log('🔄 Event updated successfully');
}

/**
 * Gets a user-role JWT for event operations (useful for admin users)
 */
export async function getUserJWTForEventOperations(): Promise<string> {
	const response = await fetch('/(user)/jwt');
	if (!response.ok) {
		throw new Error('Failed to get user JWT');
	}
	const data = await response.json();
	return data.jwt;
}

/**
 * Creates a Triplit client with user-role JWT for event operations
 */
export async function getEventOperationsClient(): Promise<TriplitClient> {
	const userJWT = await getUserJWTForEventOperations();
	return getFeWorkerTriplitClient(userJWT);
}