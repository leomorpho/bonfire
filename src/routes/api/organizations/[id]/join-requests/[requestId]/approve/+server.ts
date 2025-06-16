import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { approveOrganizationJoinRequest } from '$lib/organizations';

export const POST = async ({ params, locals, request }) => {
	const { id: organizationId, requestId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to approve requests (org leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['user_id', '=', locals.user.id]
			])
		);

		const organization = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organizations').Where([['id', '=', organizationId]])
		);

		const canApprove =
			organization?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canApprove) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const { role } = await request.json();
		const validRoles = ['member', 'event_manager', 'leader'];
		const approveRole = role && validRoles.includes(role) ? role : 'member';

		const joinRequest = await approveOrganizationJoinRequest(
			triplitHttpClient,
			requestId,
			locals.user.id,
			approveRole as 'leader' | 'event_manager' | 'member'
		);

		return json({
			success: true,
			joinRequest,
			message: 'Join request approved successfully'
		});
	} catch (error) {
		console.error('Error approving join request:', error);
		return json({ error: error.message || 'Failed to approve join request' }, { status: 400 });
	}
};
