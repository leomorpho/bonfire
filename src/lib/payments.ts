import type { HttpClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';

/**
 * Add or update log tokens for a user.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} userId - The user ID.
 * @param {number} numLogs - The number of logs to add or update.
 * @returns {Promise<object>} - The updated user log entry.
 */
export async function updateUserLogs(
	client: HttpClient,
	userId: string,
	numLogs: number
): Promise<object> {
	const existingLog = await client.fetchOne(
		client
			.query('user_log_tokens')
			.where([['user_id', '=', userId]])
			.build()
	);

	if (existingLog) {
		// Update existing log entry
		return await client.update('user_log_tokens', existingLog.id, (log) => {
			log.num_logs += numLogs;
			log.updated_at = new Date().toISOString();
		});
	} else {
		// Create new log entry
		const { output } = await client.insert('user_log_tokens', {
			user_id: userId,
			num_logs: numLogs,
			updated_at: new Date().toISOString()
		});
		return output;
	}
}

/**
 * Deduct logs from a user's balance.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} userId - The user ID.
 * @param {number} numLogs - The number of logs to deduct.
 * @returns {Promise<object>} - The updated log entry.
 */
export async function deductUserLogs(
	client: WorkerClient,
	userId: string,
	numLogs: number
): Promise<object> {
	const userLog = await client.fetchOne(
		client
			.query('user_log_tokens')
			.where([['user_id', '=', userId]])
			.build()
	);

	if (!userLog || userLog.num_logs < numLogs) {
		throw new Error('Insufficient logs.');
	}

	return await client.update('user_log_tokens', userLog.id, (log) => {
		log.num_logs -= numLogs;
		log.updated_at = new Date().toISOString();
	});
}

/**
 * Create a new transaction for a user.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} userId - The user ID.
 * @param {string} stripePaymentIntent - Stripe payment intent ID.
 * @param {'purchase' | 'refund'} transactionType - The type of transaction.
 * @param {number} numLogTokens - Number of logs involved.
 * @returns {Promise<object>} - The created transaction entry.
 */
export async function createTransaction(
	client: WorkerClient,
	userId: string,
	stripePaymentIntent: string,
	transactionType: 'purchase' | 'refund',
	numLogTokens: number
): Promise<object> {
	const { output } = await client.insert('transactions', {
		user_id: userId,
		stripe_payment_intent: stripePaymentIntent,
		transaction_type: transactionType,
		num_log_tokens: numLogTokens,
		created_at: new Date().toISOString()
	});

	return output;
}

/**
 * Fetch all transactions for a specific user.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} userId - The user ID.
 * @returns {Promise<object[]>} - A list of transactions.
 */
export async function getUserTransactions(client: WorkerClient, userId: string): Promise<object[]> {
	return await client.fetch(
		client
			.query('transactions')
			.where([['user_id', '=', userId]])
			.build()
	);
}

/**
 * Fetch a transaction by Stripe payment intent.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {string} paymentIntentId - The Stripe payment intent ID.
 * @returns {Promise<object | null>} - The transaction if found.
 */
export async function getTransactionByPaymentIntent(
	client: WorkerClient,
	paymentIntentId: string
): Promise<object | null> {
	return await client.fetchOne(
		client
			.query('transactions')
			.where([['stripe_payment_intent', '=', paymentIntentId]])
			.build()
	);
}
