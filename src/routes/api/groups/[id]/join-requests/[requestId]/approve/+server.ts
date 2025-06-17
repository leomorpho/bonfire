import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { approveGroupJoinRequest } from '$lib/groups';

export const POST = async ({ params, locals, request }) => {
	const { id: groupId, requestId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to approve requests (group leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('group_members').Where([
				['group_id', '=', groupId],
				['user_id', '=', locals.user.id]
			])
		);

		const group = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('groups').Where([['id', '=', groupId]])
		);

		const canApprove =
			group?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canApprove) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const { role } = await request.json();
		const validRoles = ['member', 'event_manager', 'leader'];
		const approveRole = role && validRoles.includes(role) ? role : 'member';

		const joinRequest = await approveGroupJoinRequest(
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
