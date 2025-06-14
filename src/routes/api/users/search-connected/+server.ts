import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { and, or } from '@triplit/client';

export const GET = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const url = new URL(request.url);
	const searchQuery = url.searchParams.get('q') || '';
	const eventId = url.searchParams.get('eventId');
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = parseInt(url.searchParams.get('limit') || '20');

	try {
		// Get events the current user attended
		const userEventIds = await triplitHttpClient.fetch(
			triplitHttpClient.query('attendees').Where(['user_id', '=', user.id]).Select(['event_id'])
		);

		if (userEventIds.length === 0) {
			return json({ users: [], hasMore: false, total: 0 });
		}

		const eventIdsAttended = userEventIds.map((attendance) => attendance.event_id);

		// Get current attendees of the target event to exclude them (only when eventId is provided)
		let currentAttendeeIds = [];
		if (eventId) {
			const currentAttendees = await triplitHttpClient.fetch(
				triplitHttpClient.query('attendees').Where(['event_id', '=', eventId]).Select(['user_id'])
			);
			currentAttendeeIds = currentAttendees.map((attendee) => attendee.user_id);
		}

		// Get users blocked by current user
		const blockedByUser = await triplitHttpClient.fetch(
			triplitHttpClient.query('user_blocks').Where(['blocker_user_id', '=', user.id]).Select(['blocked_user_id'])
		);
		const blockedUserIds = blockedByUser.map((block) => block.blocked_user_id);

		// Get users who blocked current user
		const blockedCurrentUser = await triplitHttpClient.fetch(
			triplitHttpClient.query('user_blocks').Where(['blocked_user_id', '=', user.id]).Select(['blocker_user_id'])
		);
		const blockerUserIds = blockedCurrentUser.map((block) => block.blocker_user_id);

		// Combine all user IDs to exclude
		const excludedUserIds = [...currentAttendeeIds, ...blockedUserIds, ...blockerUserIds];

		// Find users who attended shared events
		const connectedUsersQuery = triplitHttpClient
			.query('attendees')
			.Where([
				and([
					['event_id', 'in', eventIdsAttended],
					['user_id', '!=', user.id], // Exclude current user
					['user_id', 'nin', excludedUserIds] // Exclude current event attendees and blocked users
				])
			])
			.SubqueryOne('user', triplitHttpClient.query('user').Where(['id', '=', '$1.user_id']))
			.Select(['user_id', 'event_id']);

		const connectedAttendances = await triplitHttpClient.fetch(connectedUsersQuery);

		// Group by user and count shared events
		const userMap = new Map();
		connectedAttendances.forEach((attendance) => {
			const userId = attendance.user_id;
			const user = attendance.user;

			if (!user) return; // Skip if user data not available

			if (!userMap.has(userId)) {
				userMap.set(userId, {
					id: userId,
					username: user.username,
					sharedEventsCount: 0
				});
			}
			userMap.get(userId).sharedEventsCount++;
		});

		let connectedUsers = Array.from(userMap.values());

		// Apply fuzzy search filter
		if (searchQuery.trim()) {
			const searchLower = searchQuery.toLowerCase();
			connectedUsers = connectedUsers.filter((user) => {
				const username = user.username?.toLowerCase() || '';

				// Direct substring match
				if (username.includes(searchLower)) return true;

				// Fuzzy character matching
				let searchIndex = 0;
				for (let i = 0; i < username.length && searchIndex < searchLower.length; i++) {
					if (username[i] === searchLower[searchIndex]) {
						searchIndex++;
					}
				}
				return searchIndex === searchLower.length;
			});
		}

		// Sort by shared events count (descending) and then by username
		connectedUsers.sort((a, b) => {
			if (b.sharedEventsCount !== a.sharedEventsCount) {
				return b.sharedEventsCount - a.sharedEventsCount;
			}
			return (a.username || '').localeCompare(b.username || '');
		});

		// Apply pagination
		const total = connectedUsers.length;
		const offset = (page - 1) * limit;
		const paginatedUsers = connectedUsers.slice(offset, offset + limit);
		const hasMore = offset + limit < total;

		return json({
			users: paginatedUsers,
			hasMore,
			total,
			page,
			limit
		});
	} catch (error) {
		console.error('Error searching connected users:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
