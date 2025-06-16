import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { getOrganizationJoinRequests } from '$lib/organizations';

export const GET = async ({ params, locals, url }) => {
	const { id: organizationId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		// Check if user has permission to view join requests (org leader/admin)
		const membership = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organization_members').Where([
				['organization_id', '=', organizationId],
				['user_id', '=', locals.user.id]
			])
		);

		const organization = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('organizations').Where([['id', '=', organizationId]])
		);

		const canViewRequests =
			organization?.created_by_user_id === locals.user.id ||
			(membership && ['leader', 'admin'].includes(membership.role));

		if (!canViewRequests) {
			return json({ error: 'Permission denied' }, { status: 403 });
		}

		const status = url.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
		const joinRequests = await getOrganizationJoinRequests(
			triplitHttpClient,
			organizationId,
			status || undefined
		);

		return json({ joinRequests });
	} catch (error) {
		console.error('Error fetching join requests:', error);
		return json({ error: 'Failed to fetch join requests' }, { status: 500 });
	}
};
