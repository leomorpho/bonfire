import { error, redirect } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const load = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		throw error(404, 'Organization not found');
	}

	if (!locals.user) {
		redirect(302, '/login');
	}

	const client = triplitHttpClient;

	try {
		// Fetch organization data
		const organization = await client.fetchOne(
			client
				.query('organizations')
				.Where([['id', '=', id]])
		);

		if (!organization) {
			throw error(404, 'Organization not found');
		}

		// Check if current user has permission to edit banner
		// User must be creator or admin
		let canEditBanner = false;
		
		if (organization.created_by_user_id === locals.user.id) {
			canEditBanner = true;
		} else {
			// Check if user is an admin
			const membership = await client.fetchOne(
				client.query('organization_members').Where([
					['organization_id', '=', id],
					['user_id', '=', locals.user.id],
					['role', '=', 'admin']
				])
			);
			
			if (membership) {
				canEditBanner = true;
			}
		}

		if (!canEditBanner) {
			throw error(403, 'You do not have permission to edit this organization banner');
		}

		return {
			organization,
			user: locals.user
		};
	} catch (err) {
		console.error('Error loading organization banner edit page:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to load organization');
	}
};