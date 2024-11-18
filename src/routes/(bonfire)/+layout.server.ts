export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;

	return {
		user
	};
};
