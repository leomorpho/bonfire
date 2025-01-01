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
 * Updates the state of a task lock.
 * @param {string} taskName - The name of the task.
 * @param {boolean} locked - The new lock state.
 * @returns {Promise<void>} - Resolves when the lock state is updated.
 */
export async function updateTaskLockState(taskName: TaskName, locked: boolean) {
	await db
		.update(taskLockTable)
		.set({
			locked,
			updated_at: sql`(current_timestamp)`
		})
		.where(eq(taskLockTable.task_name, taskName));
}
