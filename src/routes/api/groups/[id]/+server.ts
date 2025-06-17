import { json, error } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

export async function DELETE({ params, locals }) {
	const { id } = params;

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	if (!id) {
		throw error(400, 'Group ID is required');
	}

	const client = triplitHttpClient;

	try {
		// Verify group exists
		const group = await client.fetchOne(
			client.query('groups').Where([['id', '=', id]])
		);

		if (!group) {
			throw error(404, 'Group not found');
		}

		// Check permissions - only creator can delete the group
		const isCreator = group.created_by_user_id === locals.user.id;

		if (!isCreator) {
			throw error(403, 'Only the group creator can delete the group');
		}

		// TODO: Consider adding checks for:
		// - Active events under this group
		// - Other dependencies that should prevent deletion

		// Delete the group (this should cascade to related data based on your schema)
		await client.delete('groups', id);

		return json({ success: true });

	} catch (err) {
		console.error('Error deleting group:', err);
		if (err.status) {
			throw err;
		}
		throw error(500, 'Failed to delete group');
	}
}