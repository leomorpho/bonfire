import { Status } from '$lib/enums';
import { createNewAnnouncementNotificationQueueObject } from '../src/lib/notification_queue';
import { createNewUser } from '$lib/server/database/user.model';
import { runNotificationProcessor } from '$lib/server/notifications/engine';
import { triplitHttpClient } from '$lib/server/triplit';
import { arrayToStringRepresentation, stringRepresentationToArray } from '$lib/utils';
import { faker } from '@faker-js/faker';
import { and } from '@triplit/client';
import { generateId } from 'lucia';
import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationPermissions, NotificationType } from '../src/lib/enums';
import { getAttendeeUserIdsOfEvent } from '$lib/server/triplit';
import { getEffectivePermissionSettingForEvent } from '$lib/permissions';

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

	await triplitHttpClient.insert('user', {
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

	const result = await triplitHttpClient.insert('events', event);
	return result;
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

	const result = await triplitHttpClient.insert('announcement', announcement);
	return result;
}

async function createNewAttendance(eventId: string, userId: string, status: Status) {
	const attendance = {
		id: createAttendeeId(eventId, userId),
		event_id: eventId,
		user_id: userId,
		status: status
	};
	const result = await triplitHttpClient.insert('attendees', attendance);
	return result;
}

async function markAllNotificationsAsSeen() {
	const notifications = await triplitHttpClient.fetch(triplitHttpClient.query('notifications'));

	for (const notification of notifications) {
		await triplitHttpClient.update('notifications', notification.id, (entity) => {
			entity.seen_at = new Date();
			return entity;
		});
	}
}

/**
 * Ensures each object ID in notifications is unique for a notification type, user, and event.
 */
export async function validateUniqueNotifications() {
	const notifications = await triplitHttpClient.fetch(triplitHttpClient.query('notifications'));

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
			const objectIds1 = stringRepresentationToArray(notification.object_ids);
			const objectIds2 = notification.object_ids_set;
			const objectIds = Array.from(new Set([...objectIds1, ...objectIds2]));

			const uniqueObjectIds = objectIds.filter((id) => !allObjectIds.has(id));
			uniqueObjectIds.forEach((id) => allObjectIds.add(id));

			if (uniqueObjectIds.length !== objectIds.length) {
				notification.object_ids = arrayToStringRepresentation(uniqueObjectIds);
				await triplitHttpClient.update('notifications', notification.id, (entity) => {
					entity.object_ids = arrayToStringRepresentation(uniqueObjectIds);
					entity.object_ids_set = new Set(uniqueObjectIds);
					return entity;
				});
			}
		}
	}
}

describe('Announcement notifications', () => {
	it('Notifications merge if of same type and not yet read', async () => {
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

		const announcement3 = await createNewAnnouncement(
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
			triplitHttpClient,
			user?.id as string,
			event?.id as string,
			[announcement1?.id as string]
		);
		await createNewAnnouncementNotificationQueueObject(
			triplitHttpClient,
			user?.id as string,
			event?.id as string,
			[announcement2?.id as string]
		);

		await createNewAnnouncementNotificationQueueObject(
			triplitHttpClient,
			user?.id as string,
			event?.id as string,
			[announcement3?.id as string]
		);

		await runNotificationProcessor();

		const notificationsForAttendees = await triplitHttpClient.fetch(
			triplitHttpClient.query('notifications').Where(
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
			triplitHttpClient,
			user?.id as string,
			event?.id as string,
			[announcement1?.id as string]
		);

		await runNotificationProcessor();
		await markAllNotificationsAsSeen();

		// Create 2nd notification
		await createNewAnnouncementNotificationQueueObject(
			triplitHttpClient,
			user?.id as string,
			event?.id as string,
			[announcement2?.id as string]
		);

		await runNotificationProcessor();

		const notificationsForAttendees = await triplitHttpClient.fetch(
			triplitHttpClient.query('notifications').Where(
				and([
					['user_id', '!=', user.id],
					['event_id', '=', event?.id as string]
				])
			)
		);
		console.log('---> notificationsForAttendees', notificationsForAttendees);
		// All 3 attendees should have a single notification
		expect(notificationsForAttendees).toHaveLength(6);

		const notificationsForAttendingUser1 = await triplitHttpClient.fetch(
			triplitHttpClient.query('notifications').Where(
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
	return eventId + '_' + userId;
}
// function sleep(ms) {
// 	return new Promise((resolve) => setTimeout(resolve, ms));
// }

describe('getEffectivePermissionSettingForEvent', () => {
	let user1, user2, event;

	beforeEach(async () => {
		// Seed data: Create users and an event
		user1 = await createNewTestUser();
		user2 = await createNewTestUser();
		event = await createNewEvent(user1.id);

		// Create attendances
		await createNewAttendance(event.id, user1.id, Status.GOING);
		await createNewAttendance(event.id, user2.id, Status.GOING);
	});

	it('should return true if event-specific permission is granted', async () => {
		// Set event-specific permission for user1
		await triplitHttpClient.insert('notification_permissions', {
			user_id: user1.id,
			event_id: event.id,
			permission: NotificationType.ANNOUNCEMENT,
			granted: true
		});

		const permissions = await triplitHttpClient.fetch(
			triplitHttpClient.query('notification_permissions').Where([['user_id', '=', user1.id]])
		);

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
		expect(result).toBe(true);
	});

	it('should return false if event-specific permission is not granted', async () => {
		// Set event-specific permission for user1
		await triplitHttpClient.insert('notification_permissions', {
			user_id: user1.id,
			event_id: event.id,
			permission: NotificationType.ANNOUNCEMENT,
			granted: false
		});

		const permissions = await triplitHttpClient.fetch(
			triplitHttpClient.query('notification_permissions').Where([['user_id', '=', user1.id]])
		);

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
		expect(result).toBe(false);
	});

	it('should return true if general permission is granted and no event-specific permission exists', async () => {
		// Set general permission for user1
		await triplitHttpClient.insert('notification_permissions', {
			user_id: user1.id,
			permission: NotificationType.ANNOUNCEMENT,
			granted: true
		});

		const permissions = await triplitHttpClient.fetch(
			triplitHttpClient.query('notification_permissions').Where([['user_id', '=', user1.id]])
		);

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
		expect(result).toBe(true);
	});

	it('should return false if general permission is not granted and no event-specific permission exists', async () => {
		// Set general permission for user1
		await triplitHttpClient.insert('notification_permissions', {
			user_id: user1.id,
			permission: NotificationType.ANNOUNCEMENT,
			granted: false
		});

		const permissions = await triplitHttpClient.fetch(
			triplitHttpClient.query('notification_permissions').Where([['user_id', '=', user1.id]])
		);

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
		expect(result).toBe(false);
	});

	it('should return false if no permissions are found', async () => {
		const permissions: any[] = [];

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
		expect(result).toBe(false);
	});

	it('should return false if the permission type does not match', async () => {
		// Set event-specific permission for user1
		await triplitHttpClient.insert('notification_permissions', {
			user_id: user1.id,
			event_id: event.id,
			permission: NotificationType.ANNOUNCEMENT,
			granted: true
		});

		const permissions = await triplitHttpClient.fetch(
			triplitHttpClient.query('notification_permissions').Where([['user_id', '=', user1.id]])
		);

		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.REMINDER);
		expect(result).toBe(false);
	});
});

describe('getAttendeeUserIdsOfEvent', () => {
	it('should return attendee user IDs with and without notification permissions', async () => {
		// Seed data: Create an event, attendees, and notification permissions
		const event = await createNewEvent('user-1');
		const attendingUser1 = await createNewTestUser();
		const attendingUser2 = await createNewTestUser();
		const attendingUser3 = await createNewTestUser();

		await createNewAttendance(event.id, attendingUser1.id, Status.GOING);
		await createNewAttendance(event.id, attendingUser2.id, Status.GOING);
		await createNewAttendance(event.id, attendingUser3.id, Status.GOING);

		const result = await getAttendeeUserIdsOfEvent(
			event.id,
			[Status.GOING],
			NotificationType.ANNOUNCEMENT
		);

		expect(result.granted).toContain(attendingUser1.id);
		expect(result.granted).toContain(attendingUser3.id);
		expect(result.granted).toContain(attendingUser2.id);
	});

	it('should handle the case where no attendees match the criteria', async () => {
		const event = await createNewEvent('user-1');

		const result = await getAttendeeUserIdsOfEvent(
			event.id,
			[Status.GOING],
			NotificationType.ANNOUNCEMENT
		);

		expect(result.granted).toHaveLength(0);
		expect(result.notGranted).toHaveLength(0);
	});
});
