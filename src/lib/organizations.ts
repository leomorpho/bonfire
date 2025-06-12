import { TriplitClient, HttpClient } from '@triplit/client';
import { generatePassphraseId } from './utils';

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

	// Automatically add the creator as an admin member
	await addOrganizationMember(client, orgId, createdByUserId, 'admin', createdByUserId);

	return organization;
}

/**
 * Adds a user as a member of an organization
 */
export async function addOrganizationMember(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	role: 'admin' | 'editor' | 'member' = 'member',
	addedByUserId: string
) {
	const membership = await client.insert('organization_members', {
		organization_id: organizationId,
		user_id: userId,
		role,
		added_by_user_id: addedByUserId
	});

	// If the new member is being made an admin, add them as admin to all org events
	if (role === 'admin') {
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
		client
			.query('organization_viewers')
			.where([
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
	// Remove membership
	await client.delete('organization_members', [
		['organization_id', '=', organizationId],
		['user_id', '=', userId]
	]);

	// Remove as admin from all org events
	await removeAdminFromAllOrgEvents(client, organizationId, userId);
}

/**
 * Updates a member's role in an organization
 */
export async function updateOrganizationMemberRole(
	client: TriplitClient | HttpClient,
	organizationId: string,
	userId: string,
	newRole: 'admin' | 'editor' | 'member',
	updatedByUserId: string
) {
	const existingMember = await client.fetchOne(
		client
			.query('organization_members')
			.where([
				['organization_id', '=', organizationId],
				['user_id', '=', userId]
			])
	);

	if (!existingMember) {
		throw new Error('User is not a member of this organization');
	}

	const oldRole = existingMember.role;

	// Update the role
	await client.update('organization_members', existingMember.id, {
		role: newRole
	});

	// Handle admin role changes
	if (oldRole !== 'admin' && newRole === 'admin') {
		// User became admin - add to all org events
		await addAdminToAllOrgEvents(client, organizationId, userId, updatedByUserId);
	} else if (oldRole === 'admin' && newRole !== 'admin') {
		// User lost admin role - remove from all org events
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
		client.query('events').where([['organization_id', '=', organizationId]])
	);

	// Add user as admin to each event
	for (const event of orgEvents) {
		// Check if user is already an admin of this event
		const existingAdmin = await client.fetchOne(
			client
				.query('event_admins')
				.where([
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
		client.query('events').where([['organization_id', '=', organizationId]])
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
	// Get all org admins
	const orgAdmins = await client.fetch(
		client
			.query('organization_members')
			.where([
				['organization_id', '=', organizationId],
				['role', '=', 'admin']
			])
	);

	// Add each org admin as event admin (except if they're already the event creator)
	for (const orgAdmin of orgAdmins) {
		if (orgAdmin.user_id !== eventCreatorId) {
			// Check if they're already an event admin
			const existingAdmin = await client.fetchOne(
				client
					.query('event_admins')
					.where([
						['event_id', '=', eventId],
						['user_id', '=', orgAdmin.user_id]
					])
			);

			if (!existingAdmin) {
				await client.insert('event_admins', {
					event_id: eventId,
					user_id: orgAdmin.user_id,
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
	const event = await client.fetchOne(
		client.query('events').where([['id', '=', eventId]])
	);

	if (event?.organization_id) {
		await addOrganizationViewer(client, event.organization_id, userId);
	}
}

/**
 * Gets all organizations a user is a member or viewer of
 */
export async function getUserOrganizations(
	client: TriplitClient | HttpClient,
	userId: string
) {
	const [memberships, viewerships] = await Promise.all([
		client.fetch(
			client
				.query('organization_members')
				.where([['user_id', '=', userId]])
				.include('organization')
		),
		client.fetch(
			client
				.query('organization_viewers')
				.where([['user_id', '=', userId]])
				.include('organization')
		)
	]);

	const orgMap = new Map();

	// Add organizations from memberships
	memberships.forEach(membership => {
		if (membership.organization) {
			orgMap.set(membership.organization.id, {
				...membership.organization,
				userRole: membership.role,
				relationship: 'member'
			});
		}
	});

	// Add organizations from viewerships (if not already a member)
	viewerships.forEach(viewership => {
		if (viewership.organization && !orgMap.has(viewership.organization.id)) {
			orgMap.set(viewership.organization.id, {
				...viewership.organization,
				userRole: null,
				relationship: 'viewer'
			});
		}
	});

	return Array.from(orgMap.values());
}