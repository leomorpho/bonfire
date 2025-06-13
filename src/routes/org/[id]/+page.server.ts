import { error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export const load = async ({ params, locals }) => {
	const { id } = params;

	if (!id) {
		throw error(404, 'Organization not found');
	}

	const client = triplitHttpClient;

	try {
		// Fetch organization data
		const organization = await client.fetchOne(
			client
				.query('organizations')
				.Where([['id', '=', id]])
				.Include('creator')
				.Include('members', (rel) => rel('members').Include('user'))
		);

		if (!organization) {
			throw error(404, 'Organization not found');
		}

		// Fetch organization events (both past and future)
		const orgEvents = await client.fetch(
			client
				.query('events')
				.Where([['organization_id', '=', id]])
				.Include('user')
				.Include('private_data')
				.Order('start_time', 'DESC')
		);

		// Separate past and future events
		const now = new Date();
		const futureEvents = orgEvents.filter((event) => new Date(event.start_time) >= now);
		const pastEvents = orgEvents.filter((event) => new Date(event.start_time) < now);

		// Check if current user is a member/viewer of this organization
		let userRole = null;
		let isViewer = false;

		if (locals.user) {
			// Check membership
			const membership = await client.fetchOne(
				client.query('organization_members').Where([
					['organization_id', '=', id],
					['user_id', '=', locals.user.id]
				])
			);

			if (membership) {
				userRole = membership.role;
			} else {
				// Check if user is a viewer
				const viewership = await client.fetchOne(
					client.query('organization_viewers').Where([
						['organization_id', '=', id],
						['user_id', '=', locals.user.id]
					])
				);

				if (viewership) {
					isViewer = true;
				}
			}
		}

		return {
			organization,
			futureEvents,
			pastEvents,
			userRole,
			isViewer,
			user: locals.user
		};
	} catch (err) {
		console.error('Error loading organization:', err);
		throw error(500, 'Failed to load organization');
	}
};
