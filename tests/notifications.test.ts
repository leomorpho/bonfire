import { Status } from '$lib/enums';
import { createNewAnnouncementNotificationQueueObject } from '$lib/notification';
import { createNewUser } from '$lib/server/database/user.model';
import { runNotificationProcessor } from '$lib/server/push';
import { serverTriplitClient } from '$lib/server/triplit';
import { arrayToStringRepresentation, stringRepresentationToArray } from '$lib/utils';
import { faker } from '@faker-js/faker';
import { TriplitClient } from '@triplit/client';
import { and } from '@triplit/client';
import { generateId } from 'lucia';
import { describe, it, expect } from 'vitest';
import { schema } from '../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

async function createNewTestUser(
	email: string | null = null,
	emailVerified: boolean | null = null,
	numLogs: number | null = null,
	username: string | null = null
) {
	const user = {
		id: generateId(15),
		email: email ?? faker.internet.email(),
		email_verified: emailVerified ?? faker.datatype.boolean(),
		num_logs: numLogs ?? faker.number.int({ min: 0, max: 100 }),
		is_event_styles_admin: false
	};

	await createNewUser(user);

	await serverTriplitClient.insert('user', {
		id: user.id,
		username: username ?? faker.internet.username()
	});

	return user;
}

async function createNewEvent(userId: string) {
	const event = {
		title: faker.lorem.words(3),
		description: faker.lorem.sentence(),
		location: faker.location.streetAddress(),
		start_time: faker.date.future(),
		end_time: faker.date.future(),
		user_id: userId,
		style: '',
		overlay_color: null,
		overlay_opacity: faker.number.float({ min: 0, max: 1 })
	};

	const result = await serverTriplitClient.insert('events', event);
	return result.output;
}

async function createNewAnnouncement(
	content: string | null = null,
	eventId: string,
	userId: string
) {
	const announcement = {
		content: content ?? faker.lorem.sentence(),
		event_id: eventId,
		user_id: userId
	};

	const result = await serverTriplitClient.insert('announcement', announcement);
	return result.output;
}

async function createNewAttendance(eventId: string, userId: string, status: Status) {
	const attendance = {
		id: createAttendeeId(eventId, userId),
		event_id: eventId,
		user_id: userId,
		status: status
	};
	const result = await serverTriplitClient.insert('attendees', attendance);
	return result.output;
}

async function markAllNotificationsAsSeen() {
	const notifications = await serverTriplitClient.fetch(
		serverTriplitClient.query('notifications')
	);

	for (const notification of notifications) {
		await serverTriplitClient.update('notifications', notification.id, (entity) => {
			entity.seen_at = new Date();
			return entity;
		});
	}
}

/**
 * Ensures each object ID in notifications is unique for a notification type, user, and event.
 */
export async function validateUniqueNotifications() {
	const notifications = await serverTriplitClient.fetch(
		serverTriplitClient.query('notifications')
	);

	const groupedNotifications = notifications.reduce((acc, notification) => {
		const key = `${notification.object_type}-${notification.user_id}-${notification.event_id}`;
		if (!acc[key]) {
			acc[key] = [];
		}
		acc[key].push(notification);
		return acc;
	}, {});

	for (const [key, group] of Object.entries(groupedNotifications)) {
		const allObjectIds = new Set();
		for (const notification of group) {
			const objectIds = stringRepresentationToArray(notification.object_ids);
			const uniqueObjectIds = objectIds.filter((id) => !allObjectIds.has(id));
			uniqueObjectIds.forEach((id) => allObjectIds.add(id));

			if (uniqueObjectIds.length !== objectIds.length) {
				notification.object_ids = arrayToStringRepresentation(uniqueObjectIds);
				await serverTriplitClient.update('notifications', notification.id, (entity) => {
					entity.object_ids = notification.object_ids;
					return entity;
				});
			}
		}
	}
}

describe('Announcement notifications', () => {
	it('Event creator should not get announcement notifications', async () => {
		const user = await createNewTestUser();
		// console.log('user', user);
		const event = await createNewEvent(user.id);
		// console.log('event', event);

		const announcement = await createNewAnnouncement(
			faker.string.alphanumeric(100),
			event?.id as string,
			user.id
		);
		// console.log('announcement', announcement);

		const attendingUser1 = await createNewTestUser();
		const attendingUser2 = await createNewTestUser();
		const attendingUser3 = await createNewTestUser();

		await createNewAttendance(event?.id as string, attendingUser1.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser2.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser3.id, Status.GOING);

		await createNewAnnouncementNotificationQueueObject(
			serverTriplitClient as TriplitClient,
			user?.id as string,
			event?.id as string,
			[announcement?.id as string]
		);

		await runNotificationProcessor();

		const notificationsForEventCreator = await serverTriplitClient.fetch(
			serverTriplitClient
				.query('notifications')
				.Where(
					and([
						['user_id', '=', user.id],
						['event_id', '=', event?.id as string]
					])
				)
				
		);

		const notificationsForAttendees = await serverTriplitClient.fetch(
			serverTriplitClient
				.query('notifications')
				.Where(
					and([
						['user_id', '!=', user.id],
						['event_id', '=', event?.id as string]
					])
				)
				
		);

		// Event creator should have no announcement notification
		expect(notificationsForEventCreator).toHaveLength(0);

		// All 3 attendees should have a notification
		expect(notificationsForAttendees).toHaveLength(3);
	});

	it('Notifications merge if of same type and not yet read', async () => {
		const user = await createNewTestUser();
		const event = await createNewEvent(user.id);

		const announcement = await createNewAnnouncement(
			faker.string.alphanumeric(100),
			event?.id as string,
			user.id
		);

		const attendingUser1 = await createNewTestUser();
		const attendingUser2 = await createNewTestUser();
		const attendingUser3 = await createNewTestUser();

		await createNewAttendance(event?.id as string, attendingUser1.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser2.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser3.id, Status.GOING);

		// Create 2 notifications, which should merge because the previous one is unread
		await createNewAnnouncementNotificationQueueObject(
			serverTriplitClient as TriplitClient,
			user?.id as string,
			event?.id as string,
			[announcement?.id as string]
		);
		await createNewAnnouncementNotificationQueueObject(
			serverTriplitClient as TriplitClient,
			user?.id as string,
			event?.id as string,
			[announcement?.id as string]
		);

		await runNotificationProcessor();

		const notificationsForAttendees = await serverTriplitClient.fetch(
			serverTriplitClient
				.query('notifications')
				.Where(
					and([
						['user_id', '!=', user.id],
						['event_id', '=', event?.id as string]
					])
				)
				
		);

		// All 3 attendees should have a single notification
		expect(notificationsForAttendees).toHaveLength(3);
	});

	it('Notifications do not merge if of same type and previous one(s) is/are read', async () => {
		const user = await createNewTestUser();
		const event = await createNewEvent(user.id);

		const announcement1 = await createNewAnnouncement(
			faker.string.alphanumeric(100),
			event?.id as string,
			user.id
		);
		const announcement2 = await createNewAnnouncement(
			faker.string.alphanumeric(100),
			event?.id as string,
			user.id
		);

		const attendingUser1 = await createNewTestUser();
		const attendingUser2 = await createNewTestUser();
		const attendingUser3 = await createNewTestUser();

		await createNewAttendance(event?.id as string, attendingUser1.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser2.id, Status.GOING);
		await createNewAttendance(event?.id as string, attendingUser3.id, Status.GOING);

		// Create 1st notification
		await createNewAnnouncementNotificationQueueObject(
			serverTriplitClient as TriplitClient,
			user?.id as string,
			event?.id as string,
			[announcement1?.id as string]
		);

		await runNotificationProcessor();
		await markAllNotificationsAsSeen();

		// Create 2nd notification
		await createNewAnnouncementNotificationQueueObject(
			serverTriplitClient as TriplitClient,
			user?.id as string,
			event?.id as string,
			[announcement2?.id as string]
		);

		await runNotificationProcessor();

		const notificationsForAttendees = await serverTriplitClient.fetch(
			serverTriplitClient
				.query('notifications')
				.Where(
					and([
						['user_id', '!=', user.id],
						['event_id', '=', event?.id as string]
					])
				)
				
		);
		console.log('---> notificationsForAttendees', notificationsForAttendees);
		// All 3 attendees should have a single notification
		expect(notificationsForAttendees).toHaveLength(6);

		const notificationsForAttendingUser1 = await serverTriplitClient.fetch(
			serverTriplitClient
				.query('notifications')
				.Where(
					and([
						['user_id', '=', attendingUser1.id],
						['event_id', '=', event?.id as string]
					])
				)
				
		);
		expect(notificationsForAttendingUser1).toHaveLength(2);

		// validateUniqueNotifications();
	});
});

function createAttendeeId(eventId: string, userId: string) {
	throw new Error('Function not implemented.');
}
// function sleep(ms) {
// 	return new Promise((resolve) => setTimeout(resolve, ms));
// }
