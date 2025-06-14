import { json } from '@sveltejs/kit';
import { triplitHttpClient } from '$lib/server/triplit';
import { and } from '@triplit/client';

export const POST = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { userId: targetUserId } = requestBody;

	if (!targetUserId) {
		return json({ error: 'Target user ID is required' }, { status: 400 });
	}

	if (targetUserId === user.id) {
		return json({ error: 'Cannot block yourself' }, { status: 400 });
	}

	try {
		// Check if user is already blocked
		const existingBlock = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('user_blocks').Where([
				and([
					['blocker_user_id', '=', user.id],
					['blocked_user_id', '=', targetUserId]
				])
			])
		);

		if (existingBlock) {
			return json({ error: 'User is already blocked' }, { status: 400 });
		}

		// Verify target user exists
		const targetUser = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('user').Where(['id', '=', targetUserId])
		);

		if (!targetUser) {
			return json({ error: 'Target user not found' }, { status: 404 });
		}

		// Create block record
		const blockRecord = await triplitHttpClient.insert('user_blocks', {
			blocker_user_id: user.id,
			blocked_user_id: targetUserId
		});

		return json({
			success: true,
			block: {
				id: blockRecord.id,
				blocker_user_id: user.id,
				blocked_user_id: targetUserId
			}
		});
	} catch (error) {
		console.error('Error blocking user:', error);
		return json({ error: 'Failed to block user' }, { status: 500 });
	}
};

export const DELETE = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let requestBody;
	try {
		requestBody = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { userId: targetUserId } = requestBody;

	if (!targetUserId) {
		return json({ error: 'Target user ID is required' }, { status: 400 });
	}

	try {
		// Find the block record
		const blockRecord = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('user_blocks').Where([
				and([
					['blocker_user_id', '=', user.id],
					['blocked_user_id', '=', targetUserId]
				])
			])
		);

		if (!blockRecord) {
			return json({ error: 'User is not blocked' }, { status: 400 });
		}

		// Delete the block record
		await triplitHttpClient.delete('user_blocks', blockRecord.id);

		return json({
			success: true,
			message: 'User unblocked successfully'
		});
	} catch (error) {
		console.error('Error unblocking user:', error);
		return json({ error: 'Failed to unblock user' }, { status: 500 });
	}
};