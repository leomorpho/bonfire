import { fail, redirect, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { setEncryptionBackupStatus } from '$lib/server/database/user.model.js';

export const load = async (event) => {
	// Get the user from locals
	const user = event.locals.user;
	if (!user) {
		throw redirect(302, '/login'); // Redirect to login if not authenticated
	}

	return {
		user
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}
		if (user.encryption_backup_up){
			throw redirect(302, 'update-password')
		}

		await setEncryptionBackupStatus(user.id, true);

		// Redirect to the provided URL after saving
		throw redirect(302, '/dashboard/');
	}
} satisfies Actions;
