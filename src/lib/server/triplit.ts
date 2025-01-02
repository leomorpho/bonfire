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

import { HttpClient } from '@triplit/client';

export const triplitHttpClient = new HttpClient({
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
});

export async function getAttendeeUserIdsOfEvent(
	eventId: string,
	statuses: Status[],
	excludeCreator: boolean = false
): Promise<string[]> {
	// Fetch the event to get the creator's user ID if excludeCreator is true
	let creatorUserId: string | null = null;
	if (excludeCreator) {
		const eventQuery = triplitHttpClient
			.query('events')
			// .select(['user_id']) // TODO: triplit bug preventing select
			.where([['id', '=', eventId]])
			.build();

		const [event] = await triplitHttpClient.fetch(eventQuery);
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

	const query = triplitHttpClient
		.query('attendees')
		// .select(['user_id'])  // TODO: triplit bug preventing select
		.where(attendeeQueryConditions)
		.build();

	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.user_id);
}

export async function validateAnnouncements(announcementIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('announcement')
		// .select(['id']) // TODO: triplit bug preventing select
		.where([['id', 'in', announcementIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];

	return results.map((announcement: AttendeeTypescriptType) => announcement.id);
}

export async function validateFiles(fileIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('files')
		// .select(['id']) // TODO: triplit bug preventing select
		.where([['id', 'in', fileIds]])
		.build();

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as FileTypescriptType[];
	return results.map((file: FileTypescriptType) => file.id);
}

export async function validateAttendees(attendeeIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('attendees')
		.where([['id', 'in', attendeeIds]])
		// .select(['id']) // TODO: triplit bug preventing select
		.build();

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}
