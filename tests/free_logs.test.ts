import { describe, it, expect, beforeEach } from 'vitest';
import { getUsersWhoGetFreeLogs } from '$lib/server/notifications/free_logs';
import { Status, TransactionType } from '$lib/enums';
import { subHours } from 'date-fns';
import {
	createNewAttendance,
	createNewEvent,
	createNewTestUser,
	createNewTransaction,
	deleteAllEntriesInModels
} from './common';

describe('getUsersWhoGetFreeLogs', () => {
	let user1, user2, user3, user4, event1, event2, event3, event4;

	beforeEach(async () => {
		await deleteAllEntriesInModels(['user', 'events', 'attendees']);

		// Create test users
		user1 = await createNewTestUser(null, null, null, null, 'user1');
		user2 = await createNewTestUser(null, null, null, null, 'user2');
		user3 = await createNewTestUser(null, null, null, null, 'user3');
		user4 = await createNewTestUser(null, null, null, null, 'user4');

		// Event 1 is attended by everyone
		event1 = await createNewEvent(user1.id, true, subHours(new Date(), 5), 'event1');
		await createNewAttendance(event1.id, user1.id, Status.GOING);
		await createNewAttendance(event1.id, user2.id, Status.GOING);
		await createNewAttendance(event1.id, user3.id, Status.GOING);

		// User 2 then creates another event and invites everyone
		event2 = await createNewEvent(user2.id, true, subHours(new Date(), 4), 'event2');
		await createNewAttendance(event2.id, user1.id, Status.GOING);
		await createNewAttendance(event2.id, user2.id, Status.GOING);
		await createNewAttendance(event2.id, user3.id, Status.GOING);

		// User 3 hosts an event but free logs already computed
		event3 = await createNewEvent(user3.id, true, subHours(new Date(), 3), 'event3');
		await createNewTransaction(event3.id, user3.id, TransactionType.AWARD);
		await createNewAttendance(event3.id, user1.id, Status.GOING);
		await createNewAttendance(event3.id, user2.id, Status.GOING);
		await createNewAttendance(event3.id, user3.id, Status.GOING);
		await createNewAttendance(event3.id, user4.id, Status.GOING);

		// User 4 then creates another event and invites everyone
		event4 = await createNewEvent(user4.id, true, subHours(new Date(), 2), 'event4');
		await createNewAttendance(event2.id, user1.id, Status.GOING);
		await createNewAttendance(event2.id, user2.id, Status.GOING);
		await createNewAttendance(event2.id, user3.id, Status.GOING);
	});

	it('should return the correct users who get free logs', async () => {
		// Call the function to get users who get free logs
		const result = await getUsersWhoGetFreeLogs(10);

		// Expect the result to contain the correct inviter-event pairs
		expect(result).toEqual([
			{ triggeringEventId: event2.id, initialInviterId: user1.id },
			{ triggeringEventId: event4.id, initialInviterId: user3.id }
		]);
	});
});
