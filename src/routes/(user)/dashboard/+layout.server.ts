import { redirect } from '@sveltejs/kit';

export const load = async (e) => {
	const user = e.locals.user;

	// Check if the user is authenticated
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

  if (!user.salt){
		throw redirect(302, '/encryption/setup'); // Redirect to login if not authenticated
	}


	return { user }; // Pass the user data to the layout
};
