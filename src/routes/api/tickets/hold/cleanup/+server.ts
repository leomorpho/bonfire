import { json, type RequestEvent } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';

// DELETE - Clean up ticket hold when modal is closed
export async function DELETE({ request, locals }: RequestEvent): Promise<Response> {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { holdId } = body;

		if (!holdId) {
			return json({ error: 'holdId is required' }, { status: 400 });
		}

		// Find and verify the hold belongs to this user
		const hold = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('ticket_holds')
				.Where([['id', '=', holdId]])
				.Where([['user_id', '=', user.id]])
		);

		if (!hold) {
			// Hold doesn't exist or doesn't belong to user - that's okay
			return json({ success: true, message: 'Hold not found or already cleaned up' });
		}

		// Delete the hold since we're cleaning up
		await triplitHttpClient.delete('ticket_holds', holdId);

		return json({ success: true, message: 'Hold deleted successfully' });
	} catch (error) {
		console.error('Error cleaning up ticket hold:', error);
		return json({ error: 'Failed to clean up hold' }, { status: 500 });
	}
}
