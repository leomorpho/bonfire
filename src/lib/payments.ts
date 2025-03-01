import type { HttpClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Handles Stripe webhook event when a user purchases logs.
 * @param {WorkerClient} client - The Triplit client instance.
 * @param {any} stripeEvent - The Stripe event object.
 * @returns {Promise<void>}
 */
export async function handleLogPurchaseWebhook(
	client: HttpClient,
	stripeCustomerId: string,
	paymentIntentId: string,
	priceId: string,
	quantity: number = 1
): Promise<void> {
	let startingCount = 1;

	switch (priceId) {
		case publicEnv.PUBLIC_1_LOG_PRICE_ID:
			startingCount = 1;
			break;
		case publicEnv.PUBLIC_3_LOG_PRICE_ID:
			startingCount = 3;
			break;
		case publicEnv.PUBLIC_10_LOG_PRICE_ID:
			startingCount = 10;
			break;
		default:
			throw new Error(`non-existent price ID ${priceId} given to handleLogPurchaseWebhook`);
	}
	// Get log count from product ID.
	const numLogTokensPurchased = quantity * startingCount;

	const userLogObject = await client.fetchOne(
		client.query('user_log_tokens').where(['stripe_customer_id', '=', stripeCustomerId]).build()
	);

	if (!userLogObject) {
		console.error(`User not found for Stripe customer ID: ${stripeCustomerId}`);
		return;
	}

	// Step 1: Update user's log count
	await client.update('user_log_tokens', userLogObject.id, (log) => {
		log.num_logs += numLogTokensPurchased;
		log.updated_at = new Date().toISOString();
	});

	// Step 2: Create a transaction record
	await createTransaction(
		client,
		userLogObject.user_id,
		paymentIntentId,
		'purchase',
		numLogTokensPurchased
	);

	console.log(
		`✅ Successfully processed log purchase for user ${userLogObject.user_id}: +${numLogTokensPurchased} logs.`
	);
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
	client: HttpClient,
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
