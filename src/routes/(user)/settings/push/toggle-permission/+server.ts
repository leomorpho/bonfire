import { db } from '$lib/server/database/db';
import { notificationPermissionTable } from '$lib/server/database/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST({ request, locals }) {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
		}

		const { type } = await request.json();

		// Query the existing permission record
		const existingPermission = await db
			.Select()
			.from(notificationPermissionTable)
			.Where(eq(notificationPermissionTable.userId, userId))
			.limit(1);

		if (!existingPermission.length) {
			// If no record exists, insert a default record
			await db.insert(notificationPermissionTable).values({
				userId,
				oneDayReminder: false,
				eventActivity: false,
				created_at: sql`(current_timestamp)`,
				updated_at: sql`(current_timestamp)`
			});
		}

		// Determine the current value and toggle it
		const currentValue = existingPermission[0]?.[type] ?? false;
		const newValue = !currentValue;

		// Update the permission
		await db
			.update(notificationPermissionTable)
			.set({ [type]: newValue, updated_at: sql`(current_timestamp)` })
			.Where(eq(notificationPermissionTable.userId, userId));

		return new Response(JSON.stringify({ success: true, newValue }), { status: 200 });
	} catch (error) {
		console.error('Error updating permissions:', error);
		return new Response(JSON.stringify({ error: 'Failed to update permissions' }), { status: 500 });
	}
}
