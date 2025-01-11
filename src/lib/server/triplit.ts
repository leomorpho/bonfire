import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { Status } from '$lib/enums';
import type { AttendeeTypescriptType, FileTypescriptType } from '$lib/types';

import { and, HttpClient } from '@triplit/client';

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

export async function validateTempAttendees(attendeeIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('temporary_attendees')
		.where([['id', 'in', attendeeIds]])
		// .select(['id']) // TODO: triplit bug preventing select
		.build();

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}

export const convertTempToPermanentUser = async (
	userId: string,
	eventId: string,
	triplitUserUsername: string|null,
	triplitUserId: string,
	existingTempAttendeeId: string,
	existingTempAttendeeName: string,
	existingTempAttendeeStatus: string
) => {
	try {
		console.log('---> converting temp user to permament user');

		if (!triplitUserUsername) {
			triplitHttpClient.update('user', triplitUserId, async (e) => {
				e.username = existingTempAttendeeName;
			});
		}
		// Convert temp attendee to normal attendance
		await triplitHttpClient.insert('attendees', {
			user_id: userId,
			event_id: eventId,
			status: existingTempAttendeeStatus
		});

		// Convert all files imported by this temp attendee to the current user
		const files = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('files')
				.where([
					and([
						['event_id', '=', eventId],
						['temp_uploader_id', '=', existingTempAttendeeId]
					])
				])
				.build()
		);

		// Update each file to set uploader_id to the user's ID
		for (const file of files) {
			await triplitHttpClient.update('files', file.id, async (entity) => {
				entity.uploader_id = userId;
			});
		}

		// Finally, delete the temp attendee, which means the user will only be able to see past
		// temp interactions with logged in user profile
		await triplitHttpClient.delete('temporary_attendees', existingTempAttendeeId as string);
	} catch (e) {
		console.error(
			`failed to link up temp attendee with id ${existingTempAttendeeId} to user with id ${userId}`,
			e
		);
	}
};
