import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const POST = async ({ params, request, locals }) => {
	const { id: groupId } = params;
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!groupId) {
		return json({ error: 'Group ID required' }, { status: 400 });
	}

	try {
		const { email, role } = await request.json();

		if (!email || !role) {
			return json({ error: 'Email and role are required' }, { status: 400 });
		}

		// Validate role
		if (!['leader', 'event_manager'].includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}

		// Check if user has permission to manage this group
		const group = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('groups').Where([['id', '=', groupId]])
		);

		if (!group) {
			return json({ error: 'Group not found' }, { status: 404 });
		}

		const isCreator = group.created_by_user_id === user.id;
		let hasPermission = isCreator;

		if (!isCreator) {
			// Check if user is a leader of the group
			const membership = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('group_members').Where([
					['group_id', '=', groupId],
					['user_id', '=', user.id],
					['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
				])
			);
			hasPermission = !!membership;
		}

		if (!hasPermission) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

		// TODO: Implement email invitation logic
		// This would typically involve:
		// 1. Creating an invitation record with a unique token
		// 2. Sending an email with the invitation link
		// 3. Handling the invitation acceptance on a dedicated page

		// For now, return a placeholder response
		return json({
			success: false,
			message:
				'Email invitations are not yet implemented. Please invite users who are already on the platform.'
		});
	} catch (error) {
		console.error('Error inviting user by email:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
