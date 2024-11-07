import { setEncryptionBackupStatus } from "$lib/server/database/user.model";
import { error, json, redirect } from "@sveltejs/kit";

export const GET = async ({ request, locals }) => {

	const user = locals.user;
	if (!user || !user.id) {
		throw error(401, 'Unauthorized');
	}

	try {
		console.log("##### reset encryption status");
		// Set the encryption backup status to false
		await setEncryptionBackupStatus(user.id, true);

		// Redirect after successful reset
		throw redirect(302, '/backup');
	} catch (error) {
		console.error('Failed to reset encryption status:', error);
		return json({
			status: 500,
			error: 'Failed to reset encryption status'
		});
	}
}