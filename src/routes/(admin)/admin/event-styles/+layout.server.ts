import { redirect } from '@sveltejs/kit';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	if (!user || !user.is_event_styles_admin) {
		throw redirect(302, '/');
	}

	return {
		user: user
	};
};
