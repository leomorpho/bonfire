import { triplitHttpClient } from '$lib/server/triplit';
import { Status, TransactionType } from '$lib/enums';
import { createNewUser } from '$lib/server/database/user.model';
import { triplitHttpClient } from '$lib/server/triplit';
import { faker } from '@faker-js/faker';
import { generateId } from 'lucia';

/**
 * Deletes all entries in the specified models.
 * @param modelNames - A list of model names to delete entries from.
 */
export async function deleteAllEntriesInModels(modelNames: string[]) {
	for (const modelName of modelNames) {
		const entries = await triplitHttpClient.fetch(triplitHttpClient.query(modelName));
		for (const entry of entries) {
			await triplitHttpClient.delete(modelName, entry.id);
		}
	}
}

export async function createNewTestUser(
	email: string | null = null,
	emailVerified: boolean | null = null,
	numLogs: number | null = null,
	username: string | null = null,
	id: string | null = null
) {
	const user = {
		id: id ?? generateId(15),
		email: email ?? faker.internet.email(),
		email_verified: emailVerified ?? faker.datatype.boolean(),
		num_logs: numLogs ?? faker.number.int({ min: 0, max: 100 }),
		is_event_styles_admin: false
	};

	await createNewUser(user);

	await triplitHttpClient.insert('user', {
		id: user.id,
		username: username ?? faker.internet.username()
	});

	return user;
}

export async function createNewEvent(
	userId: string,
	isPublished = true,
	startTime = faker.date.future(),
	id: string | null = null
) {
	const event = {
		id: id ?? generateId(15),
		title: faker.lorem.words(3),
		description: faker.lorem.sentence(),
		location: faker.location.streetAddress(),
		start_time: startTime,
		end_time: faker.date.future(),
		user_id: userId,
		style: '',
		overlay_color: null,
		is_published: isPublished,
		overlay_opacity: faker.number.float({ min: 0, max: 1 })
	};

	const result = await triplitHttpClient.insert('events', event);
	return result;
}

export async function createNewAnnouncement(
	content: string | null = null,
	eventId: string,
	userId: string
) {
	const announcement = {
		content: content ?? faker.lorem.sentence(),
		event_id: eventId,
		user_id: userId
	};

	const result = await triplitHttpClient.insert('announcement', announcement);
	return result;
}

function createAttendeeId(eventId: string, userId: string) {
	return eventId + '_' + userId;
}

export async function createNewAttendance(eventId: string, userId: string, status: Status) {
	const attendance = {
		id: createAttendeeId(eventId, userId),
		event_id: eventId,
		user_id: userId,
		status: status
	};
	const result = await triplitHttpClient.insert('attendees', attendance);
	return result;
}

export async function createNewTransaction(eventId: string, userId: string, type: TransactionType) {
	const transaction = {
		event_id: eventId,
		user_id: userId,
		transaction_type: type,
		num_log_tokens: 1
	};
	const result = await triplitHttpClient.insert('transactions', transaction);
	return result;
}

export async function markAllNotificationsAsSeen() {
	const notifications = await triplitHttpClient.fetch(triplitHttpClient.query('notifications'));

	for (const notification of notifications) {
		await triplitHttpClient.update('notifications', notification.id, (entity) => {
			entity.seen_at = new Date();
			return entity;
		});
	}
}
