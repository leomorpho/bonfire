import { eq } from 'drizzle-orm';
import { db } from './db';
import { userTable } from './schema';
import { serverTriplitClient } from '$lib/server/triplit';
import { error } from '@sveltejs/kit';

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
	num_logs: number;
};

export const createNewUser = async (user: NewUser) => {
	try {
		const result = await db.insert(userTable).values(user).onConflictDoNothing().returning();
		if (result.length === 0) {
			return null;
		}
		return result[0];
	} catch (err) {
		console.error('Error creating user:', err);
		throw error(500, 'Failed to create new user');
	}
};
