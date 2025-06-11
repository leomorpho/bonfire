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

export const getUserByPhone = async (phoneNumber: string) => {
	// Get user from triplit user_personal_data table since phone number is stored there
	const personalData = await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user_personal_data').Where(['phone_number', '=', phoneNumber])
	);

	if (!personalData) {
		return null;
	}

	// Get the user from the main user table
	const user = await getUserById(personalData.user_id);
	return user;
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
	email?: string;
	phone_number?: string;
	phone_country_code?: string;
	email_verified: boolean;
	num_logs: number;
	is_event_styles_admin: boolean;
	// TODO: add isReal and username fields
};

export const createNewUser = async (user: NewUser) => {
	// Only include email field if it's provided
	const userTableData: Record<string, any> = {
		id: user.id,
		email_verified: user.email_verified,
		num_logs: user.num_logs,
		is_event_styles_admin: user.is_event_styles_admin
	};

	if (user.email) {
		userTableData.email = user.email;
	}

	const result = await db.insert(userTable).values(userTableData).onConflictDoNothing().returning();
	if (result.length === 0) {
		return null;
	}
	try {
		await triplitHttpClient.insert('user', { id: user?.id, username: '', isReal: true });
	} catch (e) {
		console.error('failed to create triplit user', e);
	}

	try {
		const personalData: Record<string, any> = {
			id: 'upd_' + user?.id,
			user_id: user?.id
		};

		if (user.email) {
			personalData.email = user.email;
		}

		if (user.phone_number) {
			personalData.phone_number = user.phone_number;
		}

		if (user.phone_country_code) {
			personalData.phone_country_code = user.phone_country_code;
		}

		await triplitHttpClient.insert('user_personal_data', personalData);
	} catch (e) {
		console.error(`failed to create user_personal_data for user id ${user?.id}`, e);
	}

	try {
		await triplitHttpClient.insert('user_log_tokens', {
			user_id: user?.id,
			num_logs: user.num_logs ?? NUM_DEFAULT_LOGS_NEW_SIGNUP
		});
	} catch (e) {
		console.error(`failed to create user_log_tokens for user id ${user?.id}`, e);
	}

	try {
		// Grant revokable notification permissions
		for (const permissionType of Object.values(NotificationPermissions)) {
			await toggleNotificationPermission(
				triplitHttpClient as HttpClient,
				user?.id,
				permissionType as keyof typeof NotificationPermissions,
				true
			);
		}
	} catch (e) {
		console.error(`failed to toggle notification permissions for user id ${user?.id}`, e);
	}

	return { ...user, ...result[0] };
};
