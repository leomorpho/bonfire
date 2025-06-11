import { describe, it, expect } from 'vitest';
import { Status } from '$lib/enums';
import { schema } from '../triplit/schema';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

import { TriplitClient } from '@triplit/client';

const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: publicEnv.PUBLIC_TRIPLIT_URL,
	token: privateEnv.TRIPLIT_SERVICE_TOKEN
});

const db = serverTriplitClient;

async function seedEventsData() {
	await db.transact(
		async (tx) => {
			await tx.insert('user', {
				id: 'user-1',
				username: 'Alice'
			});
			await tx.insert('user', {
				id: 'user-2',
				username: 'Bob'
			});
			await tx.insert('user', {
				id: 'user-3',
				username: 'Charlie'
			});

			await tx.insert('events', {
				id: 'event-1',
				title: '',
				description: '',
				location: '',
				start_time: new Date(),
				end_time: new Date(),
				user_id: 'user-1',
				style: '',
				overlay_color: '',
				overlay_opacity: 0
			});
			await tx.insert('events', {
				id: 'event-3',
				title: '',
				description: '',
				location: '',
				start_time: new Date(),
				end_time: new Date(),
				user_id: 'user-2',
				style: '',
				overlay_color: '',
				overlay_opacity: 0
			});
			await tx.insert('events', {
				id: 'event-3',
				title: '',
				description: '',
				location: '',
				start_time: new Date(),
				end_time: new Date(),
				user_id: 'user-2',
				style: '',
				overlay_color: '',
				overlay_opacity: 0
			});

			await tx.insert('attendees', {
				id: 'attendee-1',
				event_id: 'event-1',
				user_id: 'user-1',
				status: Status.GOING,
				last_seen_announcement_timestamp: new Date(),
				last_seen_gallery_timestamp: new Date(),
				last_seen_reminder_timestamp: new Date()
			});
			await tx.insert('attendees', {
				id: 'attendee-2',
				event_id: 'event-2',
				user_id: 'user-2',
				status: Status.GOING,
				last_seen_announcement_timestamp: new Date(),
				last_seen_gallery_timestamp: new Date(),
				last_seen_reminder_timestamp: new Date()
			});
			await tx.insert('attendees', {
				id: 'attendee-3',
				event_id: 'event-3',
				user_id: 'user-2',
				status: Status.GOING,
				last_seen_announcement_timestamp: new Date(),
				last_seen_gallery_timestamp: new Date(),
				last_seen_reminder_timestamp: new Date()
			});
		},
		{ skipRules: true }
	);
}

describe('Permissions Tests', () => {
	it.skip('Unauthenticated users cannot query for events', async () => {
		await seedEventsData();

		const user1Token = {
			// role: 'user',
			// user_id: 'user-1'
		};

		const user1DB = db.withSessionVars(user1Token);

		const query = db.query('user');

		const users = await user1DB.fetch(query);
		console.log('users', users);
		expect(users).toHaveLength(0);
		// expect(user1Messages[0].text).toBe('Hello, world!');
	});
});

// describe('getEffectivePermissionSettingForEvent', () => {
// 	it('should return true if event-specific permission is granted', () => {
// 		const permissions = [
// 			{ event_id: 'event-1', permission: NotificationType.ANNOUNCEMENT, granted: true }
// 		];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
// 		expect(result).toBe(true);
// 	});

// 	it('should return false if event-specific permission is not granted', () => {
// 		const permissions = [
// 			{ event_id: 'event-1', permission: NotificationType.ANNOUNCEMENT, granted: false }
// 		];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
// 		expect(result).toBe(false);
// 	});

// 	it('should return true if general permission is granted and no event-specific permission exists', () => {
// 		const permissions = [
// 			{ permission: NotificationType.ANNOUNCEMENT, granted: true }
// 		];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
// 		expect(result).toBe(true);
// 	});

// 	it('should return false if general permission is not granted and no event-specific permission exists', () => {
// 		const permissions = [
// 			{ permission: NotificationType.ANNOUNCEMENT, granted: false }
// 		];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
// 		expect(result).toBe(false);
// 	});

// 	it('should return false if no permissions are found', () => {
// 		const permissions: any[] = [];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.ANNOUNCEMENT);
// 		expect(result).toBe(false);
// 	});

// 	it('should return false if the permission type does not match', () => {
// 		const permissions = [
// 			{ event_id: 'event-1', permission: NotificationType.ANNOUNCEMENT, granted: true }
// 		];

// 		const result = getEffectivePermissionSettingForEvent(permissions, NotificationType.REMINDER);
// 		expect(result).toBe(false);
// 	});
// });
