import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { rejectOrganizationJoinRequest } from '$lib/organizations';

export const POST = async ({ params, locals }) => {
	const { id: organizationId, requestId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to reject requests (org leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['user_id', '=', locals.user.id]
			])
		);

		const organization = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organizations').Where([['id', '=', organizationId]])
		);

		const canReject =
			organization?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canReject) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const joinRequest = await rejectOrganizationJoinRequest(
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
