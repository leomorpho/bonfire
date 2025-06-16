import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const POST = async ({ params, request, locals }) => {
	const { id: organizationId } = params;
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!organizationId) {
		return json({ error: 'Organization ID required' }, { status: 400 });
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

		// Check if user has permission to manage this organization
		const organization = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organizations').Where([['id', '=', organizationId]])
		);

		if (!organization) {
			return json({ error: 'Organization not found' }, { status: 404 });
		}

		const isCreator = organization.created_by_user_id === user.id;
		let hasPermission = isCreator;

		if (!isCreator) {
			// Check if user is a leader of the organization
			const membership = await triplitHttpClient.fetchOne(
				triplitHttpClient.query('organization_members').Where([
					['organization_id', '=', organizationId],
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
