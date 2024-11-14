import { eq } from 'drizzle-orm';
import { db } from './db';
import { userTable } from './schema';
import { serverTriplitClient } from '$lib/triplit';

export const getUserByEmail = async (email: string) => {
	const user = await db.select().from(userTable).where(eq(userTable.email, email));
	if (user.length === 0) {
		return null;
	} else {
		return user[0];
	}
};

export const getUserById = async (id: string) => {
	const user = await db.select().from(userTable).where(eq(userTable.id, id));
	if (user.length === 0) {
		return null;
	} else {
		return user[0];
	}
};

type UpdateUser = Partial<typeof userTable.$inferInsert>;
export const updateUser = async (id: string, user: UpdateUser) => {
	const result = await db.update(userTable).set(user).where(eq(userTable.id, id)).returning();
	if (result.length === 0) {
		return null;
	} else {
		return result[0];
	}
};

type NewUser = {
	id: string;
	email: string;
	email_verified: boolean;
};

export const createNewUser = async (user: NewUser) => {
	const result = await db.insert(userTable).values(user).onConflictDoNothing().returning();
	if (result.length === 0) {
		return null;
	}
	await serverTriplitClient.insert('user', { id: result[0].id });
	return result[0];
};

export const setEncryptionBackupStatus = async (id: string, status: boolean) => {
	const result = await db
		.update(userTable)
		.set({ encryption_backup_up: status })
		.where(eq(userTable.id, id))
		.returning();

	return result.length === 0 ? null : result[0];
};
