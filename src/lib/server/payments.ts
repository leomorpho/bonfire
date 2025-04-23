import type { HttpClient } from '@triplit/client';
import type { WorkerClient } from '@triplit/client/worker-client';
import { env as publicEnv } from '$env/dynamic/public';
import { TransactionType } from '../enums';

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
	quantity: number = 1,
	totalMoneyAmount: number | null,
	currency: string | null
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
	// NOTE: quantity is how many products of a type a user purchased (how many 1-pack, 3-pack or 10-pack etc)
	const numLogTokensPurchased = quantity * startingCount;

	const userLogObject = await client.fetchOne(
		client.query('user_log_tokens').Where(['stripe_customer_id', '=', stripeCustomerId])
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
		TransactionType.PURCHASE,
		numLogTokensPurchased,
		totalMoneyAmount,
		currency
	);

	console.log(
		`✅ Successfully processed log purchase for user ${userLogObject.user_id}: +${numLogTokensPurchased} logs.`
	);
}

/**
 * Rewards a user with a free log and links it to the event that triggered the reward.
 * @param {HttpClient} client - The Triplit client instance.
 * @param {string} userId - The user ID.
 * @param {string} eventId - The event ID that triggered the reward.
 * @returns {Promise<void>}
 */
export async function rewardUserWithFreeLog(
	client: HttpClient,
	userId: string,
	eventId: string
): Promise<void> {
	// Fetch the user's log token record
	const userLogObject = await client.fetchOne(
		client.query('user_log_tokens').Where(['user_id', '=', userId])
	);

	if (!userLogObject) {
		console.error(`User not found for user ID: ${userId}`);
		return;
	}

	// Update user's log count
	await client.update('user_log_tokens', userLogObject.id, (log) => {
		log.num_logs += 1;
		log.updated_at = new Date().toISOString();
	});

	// Create a transaction record for the free log
	await createTransaction(
		client,
		userId,
		null,
		TransactionType.AWARD,
		1, // Number of logs rewarded
		null, // No money amount for a reward
		null, // No currency for a reward
		eventId // Using eventId as a reference for the transaction
	);

	console.log(`✅ Successfully rewarded user ${userId} with 1 free log for event ${eventId}.`);
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
): Promise<void> {
	const userLog = await client.fetchOne(
		client.query('user_log_tokens').Where([['user_id', '=', userId]])
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
	stripePaymentIntent: string | null,
	transactionType: TransactionType,
	numLogTokens: number,
	totalMoneyAmount: number | null,
	currency: string | null,
	eventId: string | null
): Promise<object> {
	const output = await client.insert('transactions', {
		user_id: userId,
		stripe_payment_intent: stripePaymentIntent,
		transaction_type: transactionType,
		num_log_tokens: numLogTokens,
		total_money_amount: totalMoneyAmount,
		currency: currency,
		eventId: eventId,
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
	return await client.fetch(client.query('transactions').Where([['user_id', '=', userId]]));
}
