import { TriplitClient, HttpClient } from '@triplit/client';
import { generatePassphraseId } from './utils';
import {
	createNewOrganizationJoinRequestNotificationQueueObject,
	createNewOrganizationJoinResponseNotificationQueueObject
} from './notification_queue';

/**
 * Creates a new organization
 */
export async function createOrganization(
	client: TriplitClient | HttpClient,
	name: string,
	createdByUserId: string,
	description?: string,
	websiteUrl?: string,
	logoUrl?: string,
	isPublic: boolean = false
) {
	const orgId = await generatePassphraseId('org_');

	const organization = await client.insert('organizations', {
		id: orgId,
		name,
		description: description || null,
		website_url: websiteUrl || null,
		logo_url: logoUrl || null,
		created_by_user_id: createdByUserId,
		is_public: isPublic
	});

	// Automatically add the creator as a leader member
	await addOrganizationMember(client, orgId, createdByUserId, 'leader', createdByUserId);

	return organization;
}

/**
 * Adds a user as a member of an organization
 */
export async function addOrganizationMember(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	role: 'leader' | 'event_manager' | 'member' = 'member',
	addedByUserId: string
) {
	const membership = await client.insert('organization_members', {
		organization_id: organizationId,
		user_id: userId,
		role,
		added_by_user_id: addedByUserId
	});

	// If the new member is being made a leader, add them as admin to all org events
	if (role === 'leader') {
		await addAdminToAllOrgEvents(client, organizationId, userId, addedByUserId);
	}

	return membership;
}

/**
 * Adds a user as a viewer of an organization
 */
export async function addOrganizationViewer(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string
) {
	// Check if user is already a viewer
	const existingViewer = await client.fetchOne(
		client.query('organization_viewers').Where([
			['organization_id', '=', organizationId],
			['user_id', '=', userId]
		])
	);

	if (!existingViewer) {
		return await client.insert('organization_viewers', {
			organization_id: organizationId,
			user_id: userId
		});
	}

	return existingViewer;
}

/**
 * Removes a user from organization membership
 */
export async function removeOrganizationMember(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string
) {
	console.log('🔄 removeOrganizationMember called with:', { organizationId, userId });

	// First, check if the membership exists
	const existingMembership = await client.fetchOne(
		client.query('organization_members').Where([
			['organization_id', '=', organizationId],
			['user_id', '=', userId]
		])
	);

	console.log('📋 Existing membership found:', existingMembership);

	if (!existingMembership) {
		console.log('⚠️ No membership found to delete');
		return;
	}

	// Get organization to check creator
	const organization = await client.fetchOne(
		client.query('organizations').Where([['id', '=', organizationId]])
	);

	// Prevent removing the organization creator
	if (organization?.created_by_user_id === userId) {
		throw new Error('The organization creator cannot be removed from the organization');
	}

	// Check if this would remove the last leader
	const isLeader = existingMembership.role === 'leader' || existingMembership.role === 'admin';
	if (isLeader) {
		// Check if they're the last leader (including creators)
		const allLeaders = await client.fetch(
			client.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
			])
		);

		if (allLeaders.length === 1) {
			throw new Error(
				'Cannot remove the last Organization Leader. Promote another member to Leader first.'
			);
		}
	}

	// Remove membership
	console.log('🗑️ Deleting membership with ID:', existingMembership.id);
	await client.delete('organization_members', existingMembership.id);
	console.log('✅ Membership deleted successfully');

	// Remove as admin from all org events
	console.log('🔄 Removing admin from all org events...');
	await removeAdminFromAllOrgEvents(client, organizationId, userId);
	console.log('✅ Removed from org events successfully');
}

/**
 * Updates a member's role in an organization
 */
export async function updateOrganizationMemberRole(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	newRole: 'leader' | 'event_manager' | 'member',
	updatedByUserId: string
) {
	const existingMember = await client.fetchOne(
		client.query('organization_members').Where([
			['organization_id', '=', organizationId],
			['user_id', '=', userId]
		])
	);

	if (!existingMember) {
		throw new Error('User is not a member of this organization');
	}

	// Get organization to check creator
	const organization = await client.fetchOne(
		client.query('organizations').Where([['id', '=', organizationId]])
	);

	// Prevent demoting the organization creator from leader role
	if (
		organization?.created_by_user_id === userId &&
		existingMember.role === 'leader' &&
		newRole !== 'leader'
	) {
		throw new Error('The organization creator cannot be demoted from the Organization Leader role');
	}

	const oldRole = existingMember.role;

	// Check if this would demote the last leader
	const isBecomingNonLeader = (oldRole === 'leader' || oldRole === 'admin') && newRole !== 'leader';
	if (isBecomingNonLeader) {
		// Check if they're the last leader (including creators)
		const allLeaders = await client.fetch(
			client.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
			])
		);

		if (allLeaders.length === 1) {
			throw new Error(
				'Cannot demote the last Organization Leader. Promote another member to Leader first.'
			);
		}
	}

	// Update the role
	await client.update('organization_members', existingMember.id, {
		role: newRole
	});

	// Handle leader role changes (leaders get admin access to all org events)
	const oldIsLeader = oldRole === 'leader' || oldRole === 'admin'; // Support legacy admin role
	const newIsLeader = newRole === 'leader';

	if (!oldIsLeader && newIsLeader) {
		// User became leader - add to all org events as admin
		await addAdminToAllOrgEvents(client, organizationId, userId, updatedByUserId);
	} else if (oldIsLeader && !newIsLeader) {
		// User lost leader role - remove from all org events
		await removeAdminFromAllOrgEvents(client, organizationId, userId);
	}
}

/**
 * Adds a user as admin to all events in an organization
 */
async function addAdminToAllOrgEvents(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	addedByUserId: string
) {
	// Get all events for this organization
	const orgEvents = await client.fetch(
		client.query('events').Where([['organization_id', '=', organizationId]])
	);

	// Add user as admin to each event
	for (const event of orgEvents) {
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
 * Removes a user as admin from all events in an organization
 */
async function removeAdminFromAllOrgEvents(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string
) {
	// Get all events for this organization
	const orgEvents = await client.fetch(
		client.query('events').Where([['organization_id', '=', organizationId]])
	);

	// Remove user as admin from each event
	for (const event of orgEvents) {
		await client.delete('event_admins', [
			['event_id', '=', event.id],
			['user_id', '=', userId]
		]);
	}
}

/**
 * When a new event is created in an organization, add all org admins as event admins
 */
export async function addOrgAdminsToNewEvent(
	client: TriplitClient | HttpClient,
	eventId: string,
	organizationId: string,
	eventCreatorId: string
) {
	// Get all org leaders (they become admins of org events)
	const orgLeaders = await client.fetch(
		client.query('organization_members').Where([
			['organization_id', '=', organizationId],
			['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
		])
	);

	// Add each org leader as event admin (except if they're already the event creator)
	for (const orgLeader of orgLeaders) {
		if (orgLeader.user_id !== eventCreatorId) {
			// Check if they're already an event admin
			const existingAdmin = await client.fetchOne(
				client.query('event_admins').Where([
					['event_id', '=', eventId],
					['user_id', '=', orgLeader.user_id]
				])
			);

			if (!existingAdmin) {
				await client.insert('event_admins', {
					event_id: eventId,
					user_id: orgLeader.user_id,
					added_by_user_id: eventCreatorId,
					role: 'admin'
				});
			}
		}
	}
}

/**
 * Auto-add event viewers as organization viewers
 */
export async function autoAddEventViewerAsOrgViewer(
	client: TriplitClient | HttpClient,
	userId: string,
	eventId: string
) {
	// Get the event to find its organization
	const event = await client.fetchOne(client.query('events').Where([['id', '=', eventId]]));

	if (event?.organization_id) {
		await addOrganizationViewer(client, event.organization_id, userId);
	}
}

/**
 * Gets all organizations a user is a member or viewer of
 */
export async function getUserOrganizations(client: TriplitClient | HttpClient, userId: string) {
	const [memberships, viewerships] = await Promise.all([
		client.fetch(
			client
				.query('organization_members')
				.Where([['user_id', '=', userId]])
				.Include('organization')
		),
		client.fetch(
			client
				.query('organization_viewers')
				.Where([['user_id', '=', userId]])
				.Include('organization')
		)
	]);

	const orgMap = new Map();

	// Add organizations from memberships
	memberships.forEach((membership) => {
		if (membership.organization) {
			orgMap.set(membership.organization.id, {
				...membership.organization,
				userRole: membership.role,
				relationship: 'member'
			});
		}
	});

	// Add organizations from viewerships (if not already a member)
	viewerships.forEach((viewership) => {
		if (viewership.organization && !orgMap.has(viewership.organization.id)) {
			orgMap.set(viewership.organization.id, {
				...viewership.organization,
				userRole: null,
				relationship: 'viewer'
			});
		}
	});

	const organizations = Array.from(orgMap.values());

	// Get member and event counts for each organization
	for (const org of organizations) {
		const [memberCount, eventCount] = await Promise.all([
			// Get member count
			client
				.fetch(client.query('organization_members').Where([['organization_id', '=', org.id]]))
				.then((members) => members.length),
			// Get event count
			client
				.fetch(client.query('events').Where([['organization_id', '=', org.id]]))
				.then((events) => events.length)
		]);

		org.memberCount = memberCount;
		org.eventCount = eventCount;
	}

	return organizations;
}

/**
 * Submits a join request for an organization
 */
export async function submitOrganizationJoinRequest(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	message?: string
) {
	// Check if user is already a member or has pending request
	const [existingMembership, existingRequest] = await Promise.all([
		client.fetchOne(
			client.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['user_id', '=', userId]
			])
		),
		client.fetchOne(
			client.query('organization_join_requests').Where([
				['organization_id', '=', organizationId],
				['user_id', '=', userId],
				['status', '=', 'pending']
			])
		)
	]);

	if (existingMembership) {
		throw new Error('User is already a member of this organization');
	}

	if (existingRequest) {
		throw new Error('User already has a pending join request for this organization');
	}

	// Get organization settings
	const organization = await client.fetchOne(
		client.query('organizations').Where([['id', '=', organizationId]])
	);

	if (!organization) {
		throw new Error('Organization not found');
	}

	if (!organization.allow_join_requests) {
		throw new Error('This organization does not allow join requests');
	}

	// Create join request
	const joinRequest = await client.insert('organization_join_requests', {
		organization_id: organizationId,
		user_id: userId,
		message: message || null,
		status: 'pending'
	});

	// If auto-approve is enabled, automatically approve and add as member
	if (organization.auto_approve_join_requests) {
		await approveOrganizationJoinRequest(
			client,
			joinRequest.id,
			organization.created_by_user_id, // Use org creator as reviewer
			organization.default_join_role as 'leader' | 'event_manager' | 'member'
		);
	} else {
		// Create notification for organization leaders
		await createNewOrganizationJoinRequestNotificationQueueObject(client, userId, organizationId, [
			joinRequest.id
		]);
	}

	return joinRequest;
}

/**
 * Approves a join request and adds user as member
 */
export async function approveOrganizationJoinRequest(
	client: TriplitClient | HttpClient,
	joinRequestId: string,
	reviewerUserId: string,
	role: 'leader' | 'event_manager' | 'member' = 'member'
) {
	const joinRequest = await client.fetchOne(
		client.query('organization_join_requests').Where([['id', '=', joinRequestId]])
	);

	if (!joinRequest) {
		throw new Error('Join request not found');
	}

	if (joinRequest.status !== 'pending') {
		throw new Error('Join request has already been reviewed');
	}

	// Update join request status
	await client.update('organization_join_requests', joinRequestId, {
		status: 'approved',
		reviewed_at: new Date(),
		reviewed_by_user_id: reviewerUserId
	});

	// Add user as organization member
	await addOrganizationMember(
		client,
		joinRequest.organization_id,
		joinRequest.user_id,
		role,
		reviewerUserId
	);

	// Create notification for the requester
	await createNewOrganizationJoinResponseNotificationQueueObject(
		client,
		reviewerUserId,
		joinRequest.organization_id,
		[joinRequestId],
		'approved'
	);

	return joinRequest;
}

/**
 * Rejects a join request
 */
export async function rejectOrganizationJoinRequest(
	client: TriplitClient | HttpClient,
	joinRequestId: string,
	reviewerUserId: string
) {
	const joinRequest = await client.fetchOne(
		client.query('organization_join_requests').Where([['id', '=', joinRequestId]])
	);

	if (!joinRequest) {
		throw new Error('Join request not found');
	}

	if (joinRequest.status !== 'pending') {
		throw new Error('Join request has already been reviewed');
	}

	// Update join request status
	await client.update('organization_join_requests', joinRequestId, {
		status: 'rejected',
		reviewed_at: new Date(),
		reviewed_by_user_id: reviewerUserId
	});

	// Create notification for the requester
	await createNewOrganizationJoinResponseNotificationQueueObject(
		client,
		reviewerUserId,
		joinRequest.organization_id,
		[joinRequestId],
		'rejected'
	);

	return joinRequest;
}

/**
 * Gets organization join requests for admin view
 */
export async function getOrganizationJoinRequests(
	client: TriplitClient | HttpClient,
	organizationId: string,
	status?: 'pending' | 'approved' | 'rejected'
) {
	const query = client
		.query('organization_join_requests')
		.Where([['organization_id', '=', organizationId]])
		.Include('user')
		.Include('reviewed_by');

	if (status) {
		query.Where([['status', '=', status]]);
	}

	return await client.fetch(query.Order('created_at', 'DESC'));
}
