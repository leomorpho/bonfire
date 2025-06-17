import { error, redirect } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const load = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		throw error(404, 'Group not found');
	}

	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const client = triplitHttpClient;

	try {
		// Fetch group data
		const group = await client.fetchOne(
			client
				.query('groups')
				.Where([['id', '=', id]])
				.Include('creator')
		);

		if (!group) {
			throw error(404, 'Group not found');
		}

		// Check if current user has permission to manage this group
		let userRole = null;
		const isCreator = group.created_by_user_id === locals.user.id;

		if (!isCreator) {
			// Check if user is a leader (or legacy admin)
			const membership = await client.fetchOne(
				client.query('group_members').Where([
					['group_id', '=', id],
					['user_id', '=', locals.user.id],
					['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
				])
			);

			if (!membership) {
				throw error(403, 'You do not have permission to manage this group');
			}
			userRole = membership.role;
		} else {
			userRole = 'creator';
		}

		// Fetch all members
		const members = await client.fetch(
			client
				.query('group_members')
				.Where([['group_id', '=', id]])
				.Include('user')
				.Include('added_by', (rel) => rel('added_by'))
		);

		return {
			group,
			members,
			userRole,
			user: locals.user
		};
	} catch (err) {
		console.error('Error loading group management:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load group management');
	}
};
