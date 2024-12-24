import { db } from "$lib/server/database/db";
import { notificationPermissionTable } from "$lib/server/database/schema";

export async function POST({ request, locals }) {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			return { status: 401, body: { error: 'User not authenticated' } };
		}

		const { type, value } = await request.json();

		// Ensure permission record exists
		await db.insert(notificationPermissionTable).values({ userId }).onConflictDoNothing();

		// Update permission
		await db
			.update(notificationPermissionTable)
			.set({ [type]: value })
			.where(notificationPermissionTable.userId.eq(userId));

		return { success: true };
	} catch (error) {
		console.error('Error updating permissions:', error);
		return { status: 500, body: { error: 'Failed to update permissions' } };
	}
}
