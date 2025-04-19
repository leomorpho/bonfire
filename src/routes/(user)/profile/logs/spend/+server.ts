import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { triplitHttpClient } from '$lib/server/triplit';
import {
	NUM_DEFAULT_LOGS_NEW_SIGNUP,
	NUM_LOGS_SPENT_PER_BONFIRE_EVENT,
	TransactionType
} from '$lib/enums';
import { and } from '@triplit/client';
import type { UserLogToken } from '$lib/types';
import { createRemindersObjects } from '$lib/triplit';

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
			triplitHttpClient.query('transactions').Where([
				and([
					['user_id', '=', userId],
					['event_id', '=', event_id]
				])
			])
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

		const userLogTokens: UserLogToken | null = await triplitHttpClient.fetchOne(
			triplitHttpClient
				.query('user_log_tokens')
				.Where('user_id', '=', userId)
				.Select(['id', 'num_logs'])
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
			if (userLogTokens.num_logs == 0) {
				throw new Error(
					`a transaction cannot be created if the user has no logs left, user ID: ${userId}`
				);
			}
			if (userLogTokens.num_logs - NUM_LOGS_SPENT_PER_BONFIRE_EVENT < 0) {
				throw new Error(
					`a transaction cannot be created if the user has not enough logs left, user ID: ${userId}`
				);
			}
			await triplitHttpClient.update('user_log_tokens', userLogTokens.id, async (entity) => {
				entity.num_logs = entity.num_logs - NUM_LOGS_SPENT_PER_BONFIRE_EVENT;
			});
		}

		// TODO: set isPublished to true in event

		await triplitHttpClient.update('events', event_id, async (e) => {
			e.is_published = true;
		});

		const event = await triplitHttpClient.fetchOne(
			triplitHttpClient.query('events').Where('id', '=', event_id)
		);

		if (event) {
			await createRemindersObjects(
				triplitHttpClient,
				event_id,
				event?.title,
				event?.start_time as Date
			);
		}

		// Return success response
		return json({ success: true, event: event }, { status: 201 });
	} catch (error) {
		console.error('Error creating transaction:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
