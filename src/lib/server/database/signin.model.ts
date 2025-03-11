import type { Signin } from '$lib/types';
import { eq, lt, or } from 'drizzle-orm';
import { db } from './db';
import { signinTable } from './schema';
import { TimeSpan, createDate } from 'oslo';

export const getSignins = async (signin: { email: string; ip_address: string }) => {
	const batchResult = await db.batch([
		// 0. delete all signins that are older than 1 hour
		db.delete(signinTable).Where(lt(signinTable.logged_in_at, createDate(new TimeSpan(-1, 'h')))),
		// 1. return all signins from this ip_address in the past hours
		db
			.Select()
			.from(signinTable)
			.Where(or(eq(signinTable.email, signin.email), eq(signinTable.ip_address, signin.ip_address)))
	]);
	return batchResult[1];
};

export const createSigninEntry = async (signin: Signin) => {
	await db.insert(signinTable).values(signin);
};
