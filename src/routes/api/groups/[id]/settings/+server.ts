import { json, error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export async function PATCH({ params, request, locals }) {
	const { id } = params;

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!id) {
		throw error(400, 'Group ID is required');
	}

	const client = triplitHttpClient;

	try {
		// Verify group exists
		const group = await client.fetchOne(
			client.query('groups').Where([['id', '=', id]])
		);

		if (!group) {
			throw error(404, 'Group not found');
		}

		// Check permissions - only creator or leaders can modify settings
		const isCreator = group.created_by_user_id === locals.user.id;
		let hasPermission = isCreator;

		if (!isCreator) {
			const membership = await client.fetchOne(
				client.query('group_members').Where([
					['group_id', '=', id],
					['user_id', '=', locals.user.id],
					['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
				])
			);
			hasPermission = !!membership;
		}

		if (!hasPermission) {
			throw error(403, 'You do not have permission to modify this group');
		}

		// Parse request body
		const updates = await request.json();

		// Validate required fields
		if (updates.name !== undefined && (!updates.name || !updates.name.trim())) {
			throw error(400, 'Group name is required');
		}

		// Prepare update object
		const updateData: any = {};

		if (updates.name !== undefined) {
			updateData.name = updates.name.trim();
		}
		if (updates.description !== undefined) {
			updateData.description = updates.description || null;
		}
		if (updates.website_url !== undefined) {
			updateData.website_url = updates.website_url || null;
		}
		if (updates.is_public !== undefined) {
			updateData.is_public = Boolean(updates.is_public);
		}
		if (updates.allow_join_requests !== undefined) {
			updateData.allow_join_requests = Boolean(updates.allow_join_requests);
		}
		if (updates.auto_approve_join_requests !== undefined) {
			updateData.auto_approve_join_requests = Boolean(updates.auto_approve_join_requests);
		}
		if (updates.default_join_role !== undefined) {
			// Validate role
			const validRoles = ['member', 'event_manager'];
			if (!validRoles.includes(updates.default_join_role)) {
				throw error(400, 'Invalid default join role');
			}
			updateData.default_join_role = updates.default_join_role;
		}

		// Update timestamp
		updateData.updated_at = new Date().toISOString();

		// Update the group
		await client.update('groups', id, (group) => {
			Object.assign(group, updateData);
		});

		return json({ success: true });

	} catch (err) {
		console.error('Error updating group settings:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to update group settings');
	}
}