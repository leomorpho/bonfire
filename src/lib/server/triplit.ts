import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import type { Status } from '$lib/enums';

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getAttendeeUserIdsOfEvent(
	client: TriplitClient,
	eventId: string,
	statuses: Status[]
): Promise<any[]> {
	const query = client
		.query('attendees')
		.select(['user_id'])
		.where([
			['event_id', '=', eventId],
			['status', 'in', statuses]
		])
		.build();

	const results = await client.fetch(query);
    return results.map((attendee: any) => attendee.user_id);

}

export async function validateAnnouncements(
	client: TriplitClient,
	announcementIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('announcement')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', announcementIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query);
	return results.map((announcement: any) => announcement.id);
}

export async function validateFiles(
	client: TriplitClient,
	fileIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('files')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', fileIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query);
	return results.map((file: any) => file.id);
}

export async function validateAttendees(
	client: TriplitClient,
	attendeeIds: string[],
	eventId: string
): Promise<string[]> {
	const query = client
		.query('attendees')
		.select(['id', 'event_id'])
		.where([
			['id', 'in', attendeeIds],
			['event_id', '=', eventId]
		])
		.build();

	// Fetch and return only the IDs
	const results = await client.fetch(query);
	return results.map((attendee: any) => attendee.id);
}
