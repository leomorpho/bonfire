import { addHours } from 'date-fns';
import { triplitHttpClient } from './triplit';

export const getSignins = async (signin: { email: string; ip_address: string }) => {
	const expiredSignins = await triplitHttpClient.fetch(
		triplitHttpClient.query('signin').where('logged_in_at', '<', addHours(new Date(), -1)).build()
	);

	for (const signinEntry of expiredSignins) {
		await triplitHttpClient.delete('signin', signinEntry.id);
	}

	return await triplitHttpClient.fetch(
		triplitHttpClient
			.query('signin')
			.where([
				['email', '=', signin.email],
				['ip_address', '=', signin.ip_address]
			])
			.build()
	);
};

export const createSigninEntry = async (signin) => {
	await triplitHttpClient.insert('signin', signin);
};
