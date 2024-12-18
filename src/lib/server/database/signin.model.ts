import type { Signin } from '$lib/types';
import { eq, or } from 'drizzle-orm';
import { db } from './db';
import { signinTable } from './schema';
import { TimeSpan, createDate } from 'oslo';

export const getSignins = async (signin: { email: string; ip_address: string }) => {
	const oneHourAgo = createDate(new TimeSpan(-1, 'h'));

	return await db.transaction(async (trx) => {
		// Step 0: Delete all signins older than 1 hour
		await trx.delete(signinTable).where(eq(signinTable.logged_in_at, oneHourAgo));

		// Step 1: Return all signins from the given IP address or email in the past hour
		const result = await trx
			.select()
			.from(signinTable)
			.where(
				or(eq(signinTable.email, signin.email), eq(signinTable.ip_address, signin.ip_address))
			);

		return result;
	});
};

export const createSignin = async (signin: Signin) => {
	await db.insert(signinTable).values(signin);
};
