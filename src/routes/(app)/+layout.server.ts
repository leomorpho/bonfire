import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (e) => {
	const user = e.locals.user;
	if (user) {
		redirect(302, `/dashboard`);
	}

	return { user: e.locals.user };
};
