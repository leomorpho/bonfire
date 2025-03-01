import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triplitHttpClient } from '$lib/server/triplit';
import {
	NUM_DEFAULT_LOGS_NEW_SIGNUP,
	NUM_LOGS_SPENT_PER_BONFIRE_EVENT,
	TransactionType
} from '$lib/enums';
import { and } from '@triplit/client';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Get authenticated user
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse request body
		const { event_id } = await request.json();

		// Validate event_id
		if (!event_id) {
			return json({ error: 'Missing event_id' }, { status: 400 });
		}

		const transactions = await triplitHttpClient.fetch(
			triplitHttpClient
				.query('transactions')
				.where([
					and([
						['user_id', '=', userId],
						['event_id', '=', event_id]
					])
				])
				.build()
		);
		if (transactions.length > 0) {
			throw new Error('a transaction already exists for this bonfire');
		}

		await triplitHttpClient.insert('transactions', {
			user_id: userId,
			transaction_type: TransactionType.BONFIRE_HOSTED,
			num_log_tokens: NUM_LOGS_SPENT_PER_BONFIRE_EVENT,
			event_id: event_id
		});

		const userLogTokens = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('user_log_tokens')
				.where('user_id', '=', userId)
				.select(['id', 'num_logs'])
				.build()
		);

		if (!userLogTokens) {
			// NOTE: just in case that object never got created. That should NEVER happen.
			console.error(
				`This should never have happened. User did not have a user_log_tokens. User ID: ${userId}`
			);
			await triplitHttpClient.insert('user_log_tokens', {
				user_id: userId,
				num_logs: NUM_DEFAULT_LOGS_NEW_SIGNUP - NUM_LOGS_SPENT_PER_BONFIRE_EVENT
			});
		} else {
			await triplitHttpClient.update('user_log_tokens', userLogTokens.id, async (entity) => {
				entity.num_logs = entity.num_logs - NUM_LOGS_SPENT_PER_BONFIRE_EVENT;
			});
		}

		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('events').where('id', '=', event_id).include('transaction').build()
		);

		// Return success response
		return json({ success: true, event: event }, { status: 201 });
	} catch (error) {
		console.error('Error creating transaction:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
