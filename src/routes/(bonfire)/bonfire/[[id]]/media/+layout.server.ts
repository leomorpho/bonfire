import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (e) => {
	if (!e.locals.user) {
		redirect(302, '/');
	}
	return { user: e.locals.user };
};
