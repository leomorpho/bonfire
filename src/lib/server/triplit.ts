import { Status } from '$lib/enums';
import type { AttendeeTypescriptType, FileTypescriptType } from '$lib/types';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import { and, HttpClient } from '@triplit/client';
import { spawn } from 'child_process';
import { dev } from '$app/environment';
import { schema } from '../../../triplit/schema';
import { createAttendeeId } from '$lib/rsvp';

export const triplitHttpClient = new HttpClient({
	schema,
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

export function pushTriplitSchema() {
	const triplitToken = privateEnv.TRIPLIT_SERVICE_TOKEN;
	const triplitUrl = publicEnv.PUBLIC_TRIPLIT_URL;

	if (!triplitToken || !triplitUrl) {
		console.error('❌ ERROR: Triplit credentials are missing.');
		process.exit(1);
	}

	try {
		console.log('🔄 Pushing Triplit schema...');

		let triplitOptions = ['triplit', 'schema', 'push'];
		if (!dev) {
			triplitOptions = [
				'--no-install',
				'@triplit/cli',
				'schema',
				'push',
				'--token',
				triplitToken,
				'--remote',
				triplitUrl
			];
		}

		console.log(`🛠️  Running command: npx ${triplitOptions}`);

		const result = spawn('npx', triplitOptions, {
			stdio: 'inherit', // Ensures proper output passthrough
			shell: true
		});

		// ✅ Log output and errors
		if (result.stdout) console.log(`stdout: ${result.stdout.toString()}`);
		if (result.stderr) console.error(`stderr: ${result.stderr.toString()}`);

		if (result.error) {
			throw result.error; // Explicitly catch and throw the error
		}

		if (result.status !== 0) {
			throw new Error(`Triplit schema push failed with exit code ${result.status}`);
		}

		console.log('✅ Triplit schema push complete.');
	} catch (error) {
		console.error('❌ Triplit schema push failed:', error);
		process.exit(1); // 🚨 Ensure failure actually stops the app
	}
}

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
			// .Select(['user_id']) // TODO: triplit bug preventing select
			.Where([['id', '=', eventId]])
			;

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
		// .Select(['user_id'])  // TODO: triplit bug preventing select
		.Where(attendeeQueryConditions)
		;

	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.user_id);
}

export async function validateAnnouncements(announcementIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('announcement')
		// .Select(['id']) // TODO: triplit bug preventing select
		.Where([['id', 'in', announcementIds]])
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];

	return results.map((announcement: AttendeeTypescriptType) => announcement.id);
}

export async function validateFiles(fileIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('files')
		// .Select(['id']) // TODO: triplit bug preventing select
		.Where([['id', 'in', fileIds]])
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as FileTypescriptType[];
	return results.map((file: FileTypescriptType) => file.id);
}

export async function validateAttendees(attendeeIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('attendees')
		.Where([['id', 'in', attendeeIds]])
		// .Select(['id']) // TODO: triplit bug preventing select
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}

export async function validateTempAttendees(attendeeIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('temporary_attendees')
		.Where([['id', 'in', attendeeIds]])
		// .Select(['id']) // TODO: triplit bug preventing select
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((attendee: AttendeeTypescriptType) => attendee.id);
}

export async function validateUserIds(userIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('user')
		.Where([['id', 'in', userIds]])
		// .Select(['id']) // TODO: triplit bug preventing select
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((user: AttendeeTypescriptType) => user.id);
}

export async function validateMessageIds(userIds: string[]): Promise<string[]> {
	const query = triplitHttpClient
		.query('event_messages')
		.Where([['id', 'in', userIds]])
		.Select(['id'])
		;

	// Fetch and return only the IDs
	const results = (await triplitHttpClient.fetch(query)) as AttendeeTypescriptType[];
	return results.map((user: AttendeeTypescriptType) => user.id);
}

export const convertTempToPermanentUser = async (
	userId: string,
	eventId: string,
	triplitUserUsername: string | null,
	triplitUserId: string,
	existingTempAttendeeId: string,
	existingTempAttendeeName: string,
	existingTempAttendeeStatus: string,
	existingTempAttendeeGuesCount: string,
) => {
	try {
		console.log('---> converting temp user to permament user');

		if (!triplitUserUsername) {
			triplitHttpClient.update('user', triplitUserId, async (e) => {
				e.username = existingTempAttendeeName;
			});
		}
		// Convert temp attendee to normal attendance if user doesn't already have an attendance
		const attendances = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('attendees')
				.Where([
					and([
						['event_id', '=', eventId],
						['user_id', '=', userId]
					])
				])
				
		);

		if (attendances.length == 0) {
			await triplitHttpClient.insert('attendees', {
				id: createAttendeeId(eventId, userId),
				user_id: userId,
				event_id: eventId,
				status: existingTempAttendeeStatus,
				guest_count: Number(existingTempAttendeeGuesCount),
			});
		} else if (attendances.length > 1) {
			console.error(
				`tried to convert temp user to permanent user, but this user with id ${userId} has more than 1 attendance objects for event with id ${eventId}`
			);
		}

		// Convert all files imported by this temp attendee to the current user
		const files = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('files')
				.Where([
					and([
						['event_id', '=', eventId],
						['temp_uploader_id', '=', existingTempAttendeeId]
					])
				])
				
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
