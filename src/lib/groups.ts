import { TriplitClient, HttpClient } from '@triplit/client';
import { generatePassphraseId } from './utils';
import {
	createNewGroupJoinRequestNotificationQueueObject,
	createNewGroupJoinResponseNotificationQueueObject
} from './notification_queue';

/**
 * Creates a new group
 */
export async function createGroup(
	client: TriplitClient | HttpClient,
	name: string,
	createdByUserId: string,
	description?: string,
	websiteUrl?: string,
	logoUrl?: string,
	isPublic: boolean = false
) {
	const groupId = await generatePassphraseId('grp_');

	const group = await client.insert('groups', {
		id: groupId,
		name,
		description: description || null,
		website_url: websiteUrl || null,
		logo_url: logoUrl || null,
		created_by_user_id: createdByUserId,
		is_public: isPublic
	});

	// Automatically add the creator as a leader member
	await addGroupMember(client, groupId, createdByUserId, 'leader', createdByUserId);

	return group;
}

/**
 * Adds a user as a member of an group
 */
export async function addGroupMember(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string,
	role: 'leader' | 'event_manager' | 'member' = 'member',
	addedByUserId: string
) {
	const membership = await client.insert('group_members', {
		group_id: groupId,
		user_id: userId,
		role,
		added_by_user_id: addedByUserId
	});

	// If the new member is being made a leader, add them as admin to all group events
	if (role === 'leader') {
		await addAdminToAllGroupEvents(client, groupId, userId, addedByUserId);
	}

	return membership;
}

/**
 * Adds a user as a viewer of an group
 */
export async function addGroupViewer(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string
) {
	// Check if user is already a viewer
	const existingViewer = await client.fetchOne(
		client.query('group_viewers').Where([
			['group_id', '=', groupId],
			['user_id', '=', userId]
		])
	);

	if (!existingViewer) {
		return await client.insert('group_viewers', {
			group_id: groupId,
			user_id: userId
		});
	}

	return existingViewer;
}

/**
 * Removes a user from group membership
 */
export async function removeGroupMember(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string
) {
	console.log('🔄 removeGroupMember called with:', { groupId, userId });

	// First, check if the membership exists
	const existingMembership = await client.fetchOne(
		client.query('group_members').Where([
			['group_id', '=', groupId],
			['user_id', '=', userId]
		])
	);

	console.log('📋 Existing membership found:', existingMembership);

	if (!existingMembership) {
		console.log('⚠️ No membership found to delete');
		return;
	}

	// Get group to check creator
	const group = await client.fetchOne(
		client.query('groups').Where([['id', '=', groupId]])
	);

	// Prevent removing the group creator
	if (group?.created_by_user_id === userId) {
		throw new Error('The group creator cannot be removed from the group');
	}

	// Check if this would remove the last leader
	const isLeader = existingMembership.role === 'leader' || existingMembership.role === 'admin';
	if (isLeader) {
		// Check if they're the last leader (including creators)
		const allLeaders = await client.fetch(
			client.query('group_members').Where([
				['group_id', '=', groupId],
				['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
			])
		);

		if (allLeaders.length === 1) {
			throw new Error(
				'Cannot remove the last Group Leader. Promote another member to Leader first.'
			);
		}
	}

	// Remove membership
	console.log('🗑️ Deleting membership with ID:', existingMembership.id);
	await client.delete('group_members', existingMembership.id);
	console.log('✅ Membership deleted successfully');

	// Remove as admin from all group events
	console.log('🔄 Removing admin from all group events...');
	await removeAdminFromAllGroupEvents(client, groupId, userId);
	console.log('✅ Removed from group events successfully');
}

/**
 * Updates a member's role in an group
 */
export async function updateGroupMemberRole(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string,
	newRole: 'leader' | 'event_manager' | 'member',
	updatedByUserId: string
) {
	const existingMember = await client.fetchOne(
		client.query('group_members').Where([
			['group_id', '=', groupId],
			['user_id', '=', userId]
		])
	);

	if (!existingMember) {
		throw new Error('User is not a member of this group');
	}

	// Get group to check creator
	const group = await client.fetchOne(
		client.query('groups').Where([['id', '=', groupId]])
	);

	// Prevent demoting the group creator from leader role
	if (
		group?.created_by_user_id === userId &&
		existingMember.role === 'leader' &&
		newRole !== 'leader'
	) {
		throw new Error('The group creator cannot be demoted from the Group Leader role');
	}

	const oldRole = existingMember.role;

	// Check if this would demote the last leader
	const isBecomingNonLeader = (oldRole === 'leader' || oldRole === 'admin') && newRole !== 'leader';
	if (isBecomingNonLeader) {
		// Check if they're the last leader (including creators)
		const allLeaders = await client.fetch(
			client.query('group_members').Where([
				['group_id', '=', groupId],
				['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
			])
		);

		if (allLeaders.length === 1) {
			throw new Error(
				'Cannot demote the last Group Leader. Promote another member to Leader first.'
			);
		}
	}

	// Update the role
	await client.update('group_members', existingMember.id, {
		role: newRole
	});

	// Handle leader role changes (leaders get admin access to all group events)
	const oldIsLeader = oldRole === 'leader' || oldRole === 'admin'; // Support legacy admin role
	const newIsLeader = newRole === 'leader';

	if (!oldIsLeader && newIsLeader) {
		// User became leader - add to all group events as admin
		await addAdminToAllGroupEvents(client, groupId, userId, updatedByUserId);
	} else if (oldIsLeader && !newIsLeader) {
		// User lost leader role - remove from all group events
		await removeAdminFromAllGroupEvents(client, groupId, userId);
	}
}

/**
 * Adds a user as admin to all events in an group
 */
async function addAdminToAllGroupEvents(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string,
	addedByUserId: string
) {
	// Get all events for this group
	const groupEvents = await client.fetch(
		client.query('events').Where([['group_id', '=', groupId]])
	);

	// Add user as admin to each event
	for (const event of groupEvents) {
		// Check if user is already an admin of this event
		const existingAdmin = await client.fetchOne(
			client.query('event_admins').Where([
				['event_id', '=', event.id],
				['user_id', '=', userId]
			])
		);

		if (!existingAdmin) {
			await client.insert('event_admins', {
				event_id: event.id,
				user_id: userId,
				added_by_user_id: addedByUserId,
				role: 'admin'
			});
		}
	}
}

/**
 * Removes a user as admin from all events in an group
 */
async function removeAdminFromAllGroupEvents(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string
) {
	// Get all events for this group
	const groupEvents = await client.fetch(
		client.query('events').Where([['group_id', '=', groupId]])
	);

	// Remove user as admin from each event
	for (const event of groupEvents) {
		await client.delete('event_admins', [
			['event_id', '=', event.id],
			['user_id', '=', userId]
		]);
	}
}

/**
 * When a new event is created in a group, add all group admins as event admins
 */
export async function addGroupAdminsToNewEvent(
	client: TriplitClient | HttpClient,
	eventId: string,
	groupId: string,
	eventCreatorId: string
) {
	// Get all group leaders (they become admins of group events)
	const groupLeaders = await client.fetch(
		client.query('group_members').Where([
			['group_id', '=', groupId],
			['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
		])
	);

	// Add each group leader as event admin (except if they're already the event creator)
	for (const groupLeader of groupLeaders) {
		if (groupLeader.user_id !== eventCreatorId) {
			// Check if they're already an event admin
			const existingAdmin = await client.fetchOne(
				client.query('event_admins').Where([
					['event_id', '=', eventId],
					['user_id', '=', groupLeader.user_id]
				])
			);

			if (!existingAdmin) {
				await client.insert('event_admins', {
					event_id: eventId,
					user_id: groupLeader.user_id,
					added_by_user_id: eventCreatorId,
					role: 'admin'
				});
			}
		}
	}
}

/**
 * Auto-add event viewers as group viewers
 */
export async function autoAddEventViewerAsGroupViewer(
	client: TriplitClient | HttpClient,
	userId: string,
	eventId: string
) {
	// Get the event to find its group
	const event = await client.fetchOne(client.query('events').Where([['id', '=', eventId]]));

	if (event?.group_id) {
		await addGroupViewer(client, event.group_id, userId);
	}
}

/**
 * Gets all groups a user is a member or viewer of
 */
export async function getUserGroups(client: TriplitClient | HttpClient, userId: string) {
	const [memberships, viewerships] = await Promise.all([
		client.fetch(
			client
				.query('group_members')
				.Where([['user_id', '=', userId]])
				.Include('group')
		),
		client.fetch(
			client
				.query('group_viewers')
				.Where([['user_id', '=', userId]])
				.Include('group')
		)
	]);

	const groupMap = new Map();

	// Add groups from memberships
	memberships.forEach((membership) => {
		if (membership.group) {
			groupMap.set(membership.group.id, {
				...membership.group,
				userRole: membership.role,
				relationship: 'member'
			});
		}
	});

	// Add groups from viewerships (if not already a member)
	viewerships.forEach((viewership) => {
		if (viewership.group && !groupMap.has(viewership.group.id)) {
			groupMap.set(viewership.group.id, {
				...viewership.group,
				userRole: null,
				relationship: 'viewer'
			});
		}
	});

	const groups = Array.from(groupMap.values());

	// Get member and event counts for each group
	for (const group of groups) {
		const [memberCount, eventCount] = await Promise.all([
			// Get member count
			client
				.fetch(client.query('group_members').Where([['group_id', '=', group.id]]))
				.then((members) => members.length),
			// Get event count
			client
				.fetch(client.query('events').Where([['group_id', '=', group.id]]))
				.then((events) => events.length)
		]);

		group.memberCount = memberCount;
		group.eventCount = eventCount;
	}

	return groups;
}

/**
 * Submits a join request for an group
 */
export async function submitGroupJoinRequest(
	client: TriplitClient | HttpClient,
	groupId: string,
	userId: string,
	message?: string
) {
	// Check if user is already a member or has pending request
	const [existingMembership, existingRequest] = await Promise.all([
		client.fetchOne(
			client.query('group_members').Where([
				['group_id', '=', groupId],
				['user_id', '=', userId]
			])
		),
		client.fetchOne(
			client.query('group_join_requests').Where([
				['group_id', '=', groupId],
				['user_id', '=', userId],
				['status', '=', 'pending']
			])
		)
	]);

	if (existingMembership) {
		throw new Error('User is already a member of this group');
	}

	if (existingRequest) {
		throw new Error('User already has a pending join request for this group');
	}

	// Get group settings
	const group = await client.fetchOne(
		client.query('groups').Where([['id', '=', groupId]])
	);

	if (!group) {
		throw new Error('Group not found');
	}

	if (!group.allow_join_requests) {
		throw new Error('This group does not allow join requests');
	}

	// Create join request
	const joinRequest = await client.insert('group_join_requests', {
		group_id: groupId,
		user_id: userId,
		message: message || null,
		status: 'pending'
	});

	// If auto-approve is enabled, automatically approve and add as member
	if (group.auto_approve_join_requests) {
		await approveGroupJoinRequest(
			client,
			joinRequest.id,
			group.created_by_user_id, // Use group creator as reviewer
			group.default_join_role as 'leader' | 'event_manager' | 'member'
		);
	} else {
		// Create notification for group leaders
		await createNewGroupJoinRequestNotificationQueueObject(client, userId, groupId, [
			joinRequest.id
		]);
	}

	return joinRequest;
}

/**
 * Approves a join request and adds user as member
 */
export async function approveGroupJoinRequest(
	client: TriplitClient | HttpClient,
	joinRequestId: string,
	reviewerUserId: string,
	role: 'leader' | 'event_manager' | 'member' = 'member'
) {
	const joinRequest = await client.fetchOne(
		client.query('group_join_requests').Where([['id', '=', joinRequestId]])
	);

	if (!joinRequest) {
		throw new Error('Join request not found');
	}

	if (joinRequest.status !== 'pending') {
		throw new Error('Join request has already been reviewed');
	}

	// Update join request status
	await client.update('group_join_requests', joinRequestId, {
		status: 'approved',
		reviewed_at: new Date(),
		reviewed_by_user_id: reviewerUserId
	});

	// Add user as group member
	await addGroupMember(
		client,
		joinRequest.group_id,
		joinRequest.user_id,
		role,
		reviewerUserId
	);

	// Create notification for the requester
	await createNewGroupJoinResponseNotificationQueueObject(
		client,
		reviewerUserId,
		joinRequest.group_id,
		[joinRequestId],
		'approved'
	);

	return joinRequest;
}

/**
 * Rejects a join request
 */
export async function rejectGroupJoinRequest(
	client: TriplitClient | HttpClient,
	joinRequestId: string,
	reviewerUserId: string
) {
	const joinRequest = await client.fetchOne(
		client.query('group_join_requests').Where([['id', '=', joinRequestId]])
	);

	if (!joinRequest) {
		throw new Error('Join request not found');
	}

	if (joinRequest.status !== 'pending') {
		throw new Error('Join request has already been reviewed');
	}

	// Update join request status
	await client.update('group_join_requests', joinRequestId, {
		status: 'rejected',
		reviewed_at: new Date(),
		reviewed_by_user_id: reviewerUserId
	});

	// Create notification for the requester
	await createNewGroupJoinResponseNotificationQueueObject(
		client,
		reviewerUserId,
		joinRequest.group_id,
		[joinRequestId],
		'rejected'
	);

	return joinRequest;
}

/**
 * Gets group join requests for admin view
 */
export async function getGroupJoinRequests(
	client: TriplitClient | HttpClient,
	groupId: string,
	status?: 'pending' | 'approved' | 'rejected'
) {
	const query = client
		.query('group_join_requests')
		.Where([['group_id', '=', groupId]])
		.Include('user')
		.Include('reviewed_by');

	if (status) {
		query.Where([['status', '=', status]]);
	}

	return await client.fetch(query.Order('created_at', 'DESC'));
}
