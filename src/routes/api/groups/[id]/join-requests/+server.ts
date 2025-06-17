import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { getGroupJoinRequests } from '$lib/groups';

export const GET = async ({ params, locals, url }) => {
	const { id: groupId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to view join requests (group leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('group_members').Where([
				['group_id', '=', groupId],
				['user_id', '=', locals.user.id]
			])
		);

		const group = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('groups').Where([['id', '=', groupId]])
		);

		const canViewRequests =
			group?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canViewRequests) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const status = url.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
		const joinRequests = await getGroupJoinRequests(
			triplitHttpClient,
			groupId,
			status || undefined
		);

		return json({ joinRequests });
	} catch (error) {
		console.error('Error fetching join requests:', error);
		return json({ error: 'Failed to fetch join requests' }, { status: 500 });
	}
};
