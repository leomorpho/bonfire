import { triplitHttpClient } from './triplit';

export const getUserByEmail = async (email: string) => {
	return await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user_info').where('email', '=', email).build()
	);
};

export const getUserById = async (id: string) => {
	return await triplitHttpClient.fetchOne(
		triplitHttpClient.query('user_info').where('user_id', '=', id).build()
	);
};

type UpdateUser = Partial<{
	id: string;
	email: string;
	email_verified: boolean;
	num_logs: number;
	is_event_styles_admin: boolean;
}>;

export const updateUser = async (id: string, user: UpdateUser) => {
	await triplitHttpClient.insert('user_info', { id, ...user });
	return await getUserById(id);
};

type NewUser = {
	id: string;
	email: string;
	email_verified: boolean;
	num_logs: number;
	is_event_styles_admin: boolean;
};

export const createNewUser = async (user: NewUser) => {
	const { output } = await triplitHttpClient.insert('user_info', user);
	return output;
};
