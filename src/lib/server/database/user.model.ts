import { eq } from 'drizzle-orm';
import { db } from './db';
import { userTable } from './schema';
import { triplitHttpClient } from '$lib/server/triplit';
import { NotificationPermissions, NUM_DEFAULT_LOGS_NEW_SIGNUP } from '$lib/enums';
import { toggleNotificationPermission } from '$lib/permissions';
import type { HttpClient } from '@triplit/client';

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
	is_event_styles_admin: boolean;
};

export const createNewUser = async (user: NewUser) => {
	const result = await db.insert(userTable).values(user).onConflictDoNothing().returning();
	if (result.length === 0) {
		return null;
	}
	await triplitHttpClient.insert('user', { id: user?.id, username: '' });
	await triplitHttpClient.insert('user_personal_data', {
		user_id: user?.id,
		email: user.email
	});

	await triplitHttpClient.insert('user_log_tokens', {
		user_id: user?.id,
		num_logs: user.num_logs ?? NUM_DEFAULT_LOGS_NEW_SIGNUP
	});

	// Grant revokable notification permissions
	for (const permissionType of Object.values(NotificationPermissions)) {
		await toggleNotificationPermission(
			triplitHttpClient as HttpClient,
			user?.id,
			permissionType as keyof typeof NotificationPermissions,
			true
		);
	}

	return user?.id;
};
