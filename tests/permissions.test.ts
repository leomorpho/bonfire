import { describe, it, expect } from 'vitest';
import { Status } from '$lib/enums';
import { schema } from '../triplit/schema';
import { PUBLIC_TRIPLIT_URL } from '$env/static/public';
import { TRIPLIT_SERVICE_TOKEN } from '$env/static/private';
import { TriplitClient } from '@triplit/client';

const serverTriplitClient = new TriplitClient({
	schema,
	serverUrl: PUBLIC_TRIPLIT_URL,
	token: TRIPLIT_SERVICE_TOKEN
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

		const query = db.query('user').build();

		const users = await user1DB.fetch(query);
		console.log('users', users);
		expect(users).toHaveLength(0);
		// expect(user1Messages[0].text).toBe('Hello, world!');
	});
});
