import { NotificationPermissions, NotificationType, TaskName } from '$lib/enums';
import { rewardUserWithFreeLog } from '../payments';
import { getTaskLockState, updateTaskLockState } from '../tasks';
import { triplitHttpClient } from '../triplit';
import { and } from '@triplit/client';
import { subHours } from 'date-fns';
import { bulkNotifyUsers, Notification } from './notification_engine';

export const runGiveFreeLogToInitialInviterTask = async (numHoursAgo: number) => {
	const taskName = TaskName.FREE_LOGS_REWARDS;

	try {
		const locked = await getTaskLockState(taskName);
		if (locked) {
			console.debug(
				'Task runGiveFreeLogToInitialInviterTask is already running. Skipping execution.'
			);
			return;
		} else {
			console.debug('Start reminder notification task.');
		}
		await updateTaskLockState(taskName, true);

		const inviterUserIdToCausedEventIdPairs = await getUsersWhoGetFreeLogs(numHoursAgo);

		for (const inviterUserIdToCausedEventIdPair of inviterUserIdToCausedEventIdPairs) {
			await rewardUserWithFreeLog(
				triplitHttpClient,
				inviterUserIdToCausedEventIdPair.initialInviterId,
				inviterUserIdToCausedEventIdPair.triggeringEventId
			);

			const message =
				'As a special beta offer, you’ve earned a free log because someone who attended an event you created has hosted their own event! For every one of your past attendees who hosts an event, you’ll get another log. Keep hosting amazing events to earn more rewards!';

			const pushNotificationPayload = {
				title: 'You Got a Free Log!',
				body: message
			};

			// Send notification to inviter user ID
			const notification = new Notification(
				null,
				inviterUserIdToCausedEventIdPair.initialInviterId,
				message,
				NotificationType.NEW_MESSAGE,
				[],
				new Set(),
				pushNotificationPayload,
				[NotificationPermissions.event_activity],
				false // isInAppOnly
			);

			// Bulk notify end-users with these objects
			await bulkNotifyUsers([notification]);
		}
	} catch (error) {
		console.error('Error running reminder notification task:', error);
	} finally {
		try {
			await updateTaskLockState(taskName, false);
		} catch (e) {
			console.log('Failed to release task lock', e);
		}
	}
};

interface InviterCausedEventPair {
	triggeringEventId: string;
	initialInviterId: string;
}

export const getUsersWhoGetFreeLogs = async (
	numHoursAgo: number
): Promise<InviterCausedEventPair[]> => {
	// NOTE: Currently, every time a published event starts, we award
	// a free log to the user who invited the event organizer.
	const events = await triplitHttpClient.fetch(
		triplitHttpClient
			.query('events')
			.Where(
				and([
					['start_time', '>=', subHours(new Date(), numHoursAgo)],
					['start_time', '<=', new Date()],
					['is_published', '=', true]
				])
			)
			.Include('free_logs_award', (rel) => rel('free_logs_award').Select(['id']))
			.Select(['id', 'user_id'])
	);

	// Filter events that do not have a free_logs_award object
	const eventsWithoutAward = events.filter((event) => !event.free_logs_award);

	const eventIds: string[] = [];

	// userIdToEarliestAttendedEventMap maps an event creator ID to the first event they ever attended
	const userIdToEarliestAttendedEventMap: Map<string, string> = new Map();

	for (const event of eventsWithoutAward) {
		// For each user_id, find their earliest attendance
		const attendances = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('attendees')
				.Where(
					and([
						['user_id', '=', event.user_id],
						['event.is_published', '=', true]
					])
				)
				.Order('updated_at', 'ASC')
				.Limit(1)
				.Select(['event_id'])
		);

		if (attendances.length > 0) {
			const earliestAttendance = attendances[0];

			// Ignore any user who attended one of their event first.
			if (earliestAttendance.event_id == event.id) {
				continue;
			}
			const earliestAttendedEventId = earliestAttendance.event_id;
			eventIds.push(earliestAttendedEventId);
			userIdToEarliestAttendedEventMap.set(event.user_id, earliestAttendedEventId);
		}
	}

	console.log('userIdToEarliestAttendedEventMap', userIdToEarliestAttendedEventMap);

	// Fetch the creators of the earliest attended events in a single query
	const earliestEventCreators: { [key: string]: string }[] = await triplitHttpClient.fetch(
		triplitHttpClient.query('events').Where(['id', 'in', eventIds]).Select(['id', 'user_id'])
	);

	// Map event IDs to their creator IDs
	const eventIdToCreatorIdMap: Map<string, string> = new Map(
		earliestEventCreators.map((event) => [event.id, event.user_id])
	);

	const inviterUserIdToCausedEventIdPair: InviterCausedEventPair[] = [];

	for (const event of eventsWithoutAward) {
		const creatorId = event.user_id;
		const earliestAttendedEventId = userIdToEarliestAttendedEventMap.get(creatorId);
		if (earliestAttendedEventId) {
			const initialInviterId = eventIdToCreatorIdMap.get(earliestAttendedEventId);
			if (initialInviterId) {
				inviterUserIdToCausedEventIdPair.push({
					triggeringEventId: event.id,
					initialInviterId: initialInviterId
				});
			}
		}
	}

	return inviterUserIdToCausedEventIdPair;
};
