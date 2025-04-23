import { describe, it, expect, beforeEach } from 'vitest';
import { getUsersWhoGetFreeLogs } from '$lib/server/notifications/free_logs';
import { Status } from '$lib/enums';
import { subHours } from 'date-fns';
import { createNewAttendance, createNewEvent, createNewTestUser } from './notifications.test';
import { triplitHttpClient } from '$lib/server/triplit';

// Define the cleanup function
async function cleanup() {
	// Delete all test users
	const users = await triplitHttpClient.fetch(triplitHttpClient.query('user'));
	for (const user of users) {
		await triplitHttpClient.delete('user', user.id);
	}

	// Delete all test events
	const events = await triplitHttpClient.fetch(triplitHttpClient.query('events'));
	for (const event of events) {
		await triplitHttpClient.delete('events', event.id);
	}

	// Delete all test attendances
	const attendances = await triplitHttpClient.fetch(triplitHttpClient.query('attendees'));
	for (const attendance of attendances) {
		await triplitHttpClient.delete('attendees', attendance.id);
	}
}

describe('getUsersWhoGetFreeLogs', () => {
	let user1, user2, user3, event1, event2, event3;

	beforeEach(async () => {
		await cleanup();

		// Create test users
		user1 = await createNewTestUser(null, null, null, null, 'user1');
		user2 = await createNewTestUser(null, null, null, null, 'user2');
		user3 = await createNewTestUser(null, null, null, null, 'user2');

		// Event 1 is attended by everyone
		event1 = await createNewEvent(user1.id, true, subHours(new Date(), 5), 'event1');
		await createNewAttendance(event1.id, user2.id, Status.GOING);
		await createNewAttendance(event1.id, user3.id, Status.GOING);

		// User 2 then creates another event and invites everyone
		event2 = await createNewEvent(user2.id, true, subHours(new Date(), 3), 'event2');
		await createNewAttendance(event2.id, user1.id, Status.GOING);
		await createNewAttendance(event2.id, user3.id, Status.GOING);
	});

	it('should return the correct users who get free logs', async () => {
		// Call the function to get users who get free logs
		const result = await getUsersWhoGetFreeLogs(6);

		// Expect the result to contain the correct inviter-event pairs
		expect(result).toEqual([{ triggeringEventId: event2.id, initialInviterId: user1.id }]);
	});

	it('should not return users who do not meet the criteria', async () => {
		// Create an event that does not meet the criteria (not published)
		const event4 = await createNewEvent(user1.id, false, subHours(new Date(), 2));

		// Call the function to get users who get free logs
		const result = await getUsersWhoGetFreeLogs(6);

		// Expect the result to not contain the event that does not meet the criteria
		expect(result).not.toContainEqual({ triggeringEventId: event4.id, initialInviterId: user2.id });
	});

	it('should handle the case where no users meet the criteria', async () => {
		// Create events that do not meet the criteria (not published)
		await createNewEvent(user1.id, false, subHours(new Date(), 2));
		await createNewEvent(user2.id, false, subHours(new Date(), 4));

		// Call the function to get users who get free logs
		const result = await getUsersWhoGetFreeLogs(6);

		// Expect the result to be empty
		expect(result).toEqual([]);
	});
});
