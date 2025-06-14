import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const GET = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get all users blocked by current user with user details
		const blockedUsers = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('user_blocks')
				.Where(['blocker_user_id', '=', user.id])
				.SubqueryOne(
					'blocked',
					triplitHttpClient.query('user').Where(['id', '=', '$1.blocked_user_id'])
				)
				.Select(['blocked_user_id', 'created_at'])
		);

		// Transform the data to include user details
		const users = blockedUsers
			.filter((block) => block.blocked) // Only include blocks where user still exists
			.map((block) => ({
				id: block.blocked_user_id,
				username: block.blocked.username,
				blocked_at: block.created_at
			}));

		return json({
			users,
			total: users.length
		});
	} catch (error) {
		console.error('Error fetching blocked users:', error);
		return json({ error: 'Failed to fetch blocked users' }, { status: 500 });
	}
};
