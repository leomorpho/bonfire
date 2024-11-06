import { fail, redirect, type Actions } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { setEncryptionBackupStatus } from '$lib/server/database/user.model.js';

export const actions = {
	default: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { error: 'Unauthorized' });
		}

		await setEncryptionBackupStatus(user.id, false);

		// Redirect to the provided URL after saving
		throw redirect(302, '/backup');
	}
} satisfies Actions;
