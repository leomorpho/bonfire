import { TriplitClient } from '@triplit/client';
import { schema } from '../../../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { Status } from '$lib/enums';
import type { AttendeeTypescriptType, FileTypescriptType } from '$lib/types';

export const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getAttendeeUserIdsOfEvent(
	client: TriplitClient,
	eventId: string,
	statuses: Status[],
	excludeCreator: boolean = false
): Promise<string[]> {
	// Fetch the event to get the creator's user ID if excludeCreator is true
	let creatorUserId: string | null = null;
	if (excludeCreator) {
		const eventQuery = client
			.query('events')
			.select(['user_id'])
			.where([['id', '=', eventId]])
			.build();

		const [event] = await client.fetch(eventQuery);
		creatorUserId = event?.user_id || null;
	}

	// Build the attendees query
	const attendeeQueryConditions: any[] = [
		['event_id', '=', eventId],
		['status', 'in', statuses]
	];

	// Add condition to exclude the creator if applicable
	if (excludeCreator && creatorUserId) {
		attendeeQueryConditions.push(['user_id', '!=', creatorUserId]);
	}

	const query = client
		.query('attendees')
		.select(['user_id'])
		.where(attendeeQueryConditions)
		.build();

	const results = (await client.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.user_id);
}

export async function validateAnnouncements(
	client: TriplitClient,
	announcementIds: string[]
): Promise<string[]> {
	const query = client
		.query('announcement')
		.select(['id'])
		.where([['id', 'in', announcementIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as AttendeeTypescriptType[];

	return results.map((announcement: AttendeeTypescriptType) => announcement.id);
}

export async function validateFiles(client: TriplitClient, fileIds: string[]): Promise<string[]> {
	const query = client
		.query('files')
		.select(['id'])
		.where([['id', 'in', fileIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as FileTypescriptType[];
	return results.map((file: FileTypescriptType) => file.id);
}

export async function validateAttendees(
	client: TriplitClient,
	attendeeIds: string[]
): Promise<string[]> {
	const query = client
		.query('attendees')
		.select(['id'])
		.where([['id', 'in', attendeeIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await client.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}
