import { redirect } from '@sveltejs/kit';
import { seedEvent } from '$lib/seed';

export const load = async (event) => {
	// Get the user from locals
	// const user = event.locals.user;
	// if (!user) {
	// 	throw redirect(302, '/login'); // Redirect to login if not authenticated
	// }
	await seedEvent();
};
