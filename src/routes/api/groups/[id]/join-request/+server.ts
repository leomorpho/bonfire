import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { submitGroupJoinRequest } from '$lib/groups';

export const POST = async ({ params, locals, request }) => {
	const { id: groupId } = params;

	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const { message } = await request.json();

		const joinRequest = await submitGroupJoinRequest(
			triplitHttpClient,
			groupId,
			locals.user.id,
			message
		);

		return json({
			success: true,
			joinRequest,
			message: 'Join request submitted successfully'
		});
	} catch (error) {
		console.error('Error submitting join request:', error);
		return json({ error: error.message || 'Failed to submit join request' }, { status: 400 });
	}
};
