import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { rejectGroupJoinRequest } from '$lib/groups';

export const POST = async ({ params, locals }) => {
	const { id: groupId, requestId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to reject requests (group leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('group_members').Where([
				['group_id', '=', groupId],
				['user_id', '=', locals.user.id]
			])
		);

		const group = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('groups').Where([['id', '=', groupId]])
		);

		const canReject =
			group?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canReject) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const joinRequest = await rejectGroupJoinRequest(
			triplitHttpClient,
			requestId,
			locals.user.id
		);

		return json({
			success: true,
			joinRequest,
			message: 'Join request rejected'
		});
	} catch (error) {
		console.error('Error rejecting join request:', error);
		return json({ error: error.message || 'Failed to reject join request' }, { status: 400 });
	}
};
