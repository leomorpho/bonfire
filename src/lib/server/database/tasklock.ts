import type { TaskName } from '$lib/enums';
import { db } from './db';
import { taskLockTable } from './schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Gets the state of a task lock.
 * @param {string} taskName - The name of the task.
 * @returns {Promise<{ locked: boolean, updated_at: string } | null>} - The lock state or null if not found.
 */
export async function getTaskLockState(taskName: TaskName) {
	const result = await db.select().from(taskLockTable).where(eq(taskLockTable.task_name, taskName));

	return result.length > 0 ? result[0] : null;
}

/**
 * Updates or inserts the state of a task lock.
 * @param {string} taskName - The name of the task.
 * @param {boolean} locked - The new lock state.
 * @returns {Promise<void>} - Resolves when the lock state is updated or inserted.
 */
export async function updateTaskLockState(taskName: TaskName, locked: boolean) {
	const result = await db
		.insert(taskLockTable)
		.values({
			task_name: taskName,
			locked,
			updated_at: sql`(current_timestamp)`
		})
		.onConflictDoUpdate({
			target: taskLockTable.task_name,
			set: {
				locked,
				updated_at: sql`(current_timestamp)`
			}
		})
		.returning();

	console.log('result', result);
}
