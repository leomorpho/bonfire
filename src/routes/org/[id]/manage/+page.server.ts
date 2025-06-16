import { error, redirect } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const load = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		throw error(404, 'Organization not found');
	}

	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const client = triplitHttpClient;

	try {
		// Fetch organization data
		const organization = await client.fetchOne(
			client
				.query('organizations')
				.Where([['id', '=', id]])
				.Include('creator')
		);

		if (!organization) {
			throw error(404, 'Organization not found');
		}

		// Check if current user has permission to manage this organization
		let userRole = null;
		const isCreator = organization.created_by_user_id === locals.user.id;

		if (!isCreator) {
			// Check if user is a leader (or legacy admin)
			const membership = await client.fetchOne(
				client.query('organization_members').Where([
					['organization_id', '=', id],
					['user_id', '=', locals.user.id],
					['role', 'in', ['leader', 'admin']] // Support legacy 'admin' role
				])
			);

			if (!membership) {
				throw error(403, 'You do not have permission to manage this organization');
			}
			userRole = membership.role;
		} else {
			userRole = 'creator';
		}

		// Fetch all members
		const members = await client.fetch(
			client
				.query('organization_members')
				.Where([['organization_id', '=', id]])
				.Include('user')
				.Include('added_by', (rel) => rel('added_by'))
		);

		return {
			organization,
			members,
			userRole,
			user: locals.user
		};
	} catch (err) {
		console.error('Error loading organization management:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load organization management');
	}
};
